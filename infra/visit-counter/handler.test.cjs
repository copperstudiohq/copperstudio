"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createHandler } = require("./handler.cjs");

function request(method = "GET", overrides = {}) {
  return {
    rawPath: "/",
    rawQueryString: "",
    requestContext: { http: { method } },
    headers: method === "POST" ? { origin: "https://copperstudio.nl" } : {},
    ...overrides,
  };
}

function setup(initial = 0) {
  let count = initial;
  let reads = 0;
  let writes = 0;
  const logs = [];
  const store = {
    async getCount() { reads++; return count; },
    async increment() { writes++; return ++count; },
  };
  return {
    store,
    logs,
    handler: createHandler({ store, logger: { error: (line) => logs.push(JSON.parse(line)) } }),
    state: () => ({ count, reads, writes }),
  };
}

test("a new counter reads as zero without writing or exposing CORS headers", async () => {
  const { handler, state } = setup();
  const result = await handler(request());
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), { count: 0 });
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.match(result.headers["Content-Type"], /application\/json/);
  assert.equal(Object.keys(result.headers).some((key) => key.toLowerCase().startsWith("access-control-")), false);
  assert.deepEqual(state(), { count: 0, reads: 1, writes: 0 });
});

test("POST increments exactly once and returns the new total without a preceding read", async () => {
  const { handler, state } = setup(12);
  const result = await handler(request("POST"));
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), { count: 13 });
  assert.deepEqual(state(), { count: 13, reads: 0, writes: 1 });
});

test("simultaneous requests each use one atomic increment and return distinct totals", async () => {
  const { handler, state } = setup();
  const results = await Promise.all(Array.from({ length: 30 }, () => handler(request("POST"))));
  assert.deepEqual(results.map((result) => JSON.parse(result.body).count).sort((a, b) => a - b),
    Array.from({ length: 30 }, (_, index) => index + 1));
  assert.deepEqual(state(), { count: 30, reads: 0, writes: 30 });
});

test("POST accepts the www origin and case-insensitive header names", async () => {
  const { handler } = setup();
  const result = await handler(request("POST", { headers: { Origin: "https://www.copperstudio.nl" } }));
  assert.equal(result.statusCode, 200);
});

test("unknown paths and methods never touch storage", async () => {
  const { handler, state } = setup();
  assert.equal((await handler(request("POST", { rawPath: "/other" }))).statusCode, 404);
  for (const method of ["PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]) {
    const result = await handler(request(method));
    assert.equal(result.statusCode, 405);
    assert.equal(result.headers.Allow, "GET, POST");
  }
  assert.equal((await handler({ rawPath: "/" })).statusCode, 405);
  assert.deepEqual(state(), { count: 0, reads: 0, writes: 0 });
});

test("writes need an allowed origin, and foreign-origin reads are rejected", async () => {
  const { handler, state } = setup();
  for (const headers of [{}, { origin: "null" }, { origin: "https://other.example" }, { origin: "http://copperstudio.nl" }]) {
    assert.equal((await handler(request("POST", { headers }))).statusCode, 403);
  }
  assert.equal((await handler(request("GET", { headers: { origin: "https://other.example" } }))).statusCode, 403);
  assert.deepEqual(state(), { count: 0, reads: 0, writes: 0 });
});

test("client-supplied bodies and query parameters cannot select or change a counter", async () => {
  const { handler, state } = setup(7);
  for (const overrides of [
    { body: '{"count":1000}' },
    { body: " " },
    { body: "eyJjb3VudCI6MTAwMH0=", isBase64Encoded: true },
    { rawQueryString: "delta=1000" },
    { queryStringParameters: { site: "another-site" } },
  ]) {
    assert.equal((await handler(request("POST", overrides))).statusCode, 400);
  }
  assert.deepEqual(state(), { count: 7, reads: 0, writes: 0 });
});

test("storage failures return a quiet 503 and are never retried", async () => {
  const { handler, store, logs, state } = setup();
  let attempts = 0;
  store.increment = async () => {
    attempts++;
    throw Object.assign(new Error("Private implementation details"), { name: "StorageUnavailable" });
  };
  const result = await handler(request("POST", { headers: { origin: "https://copperstudio.nl", authorization: "secret" } }));
  assert.equal(result.statusCode, 503);
  assert.deepEqual(JSON.parse(result.body), { error: "Visit count unavailable" });
  assert.deepEqual(logs, [{ event: "visit_counter_failed", operation: "increment", error: "StorageUnavailable" }]);
  assert.equal(JSON.stringify(logs).includes("secret"), false);
  assert.equal(JSON.stringify(logs).includes("Private implementation"), false);
  assert.equal(attempts, 1);
  assert.deepEqual(state(), { count: 0, reads: 0, writes: 0 });
});

test("unsafe, negative, fractional, or missing store totals are unavailable rather than fabricated", async () => {
  for (const count of [NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, undefined, "12"]) {
    const store = { getCount: async () => count, increment: async () => count };
    const handler = createHandler({ store, logger: { error() {} } });
    assert.equal((await handler(request())).statusCode, 503);
    assert.equal((await handler(request("POST"))).statusCode, 503);
  }
});
