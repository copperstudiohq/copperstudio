"use strict";

const SITE = "copperstudio.nl";
const ALLOWED_ORIGINS = new Set([
  "https://copperstudio.nl",
  "https://www.copperstudio.nl",
]);

/** @typedef {{ getCount: () => Promise<number>, increment: () => Promise<number> }} CounterStore */

function response(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

/**
 * The URL's CORS configuration supplies Access-Control-* headers separately.
 * The handler accepts only a fixed, anonymous aggregate counter operation.
 * @param {{ store: CounterStore, logger?: Pick<Console, "error"> }} dependencies
 */
function createHandler({ store, logger = console }) {
  return async function handle(event) {
    const path = event?.rawPath ?? event?.requestContext?.http?.path ?? "/";
    if (path !== "/") return response(404, { error: "Not found" });

    const method = event?.requestContext?.http?.method;
    if (method !== "GET" && method !== "POST") {
      return response(405, { error: "Method not allowed" }, { Allow: "GET, POST" });
    }

    const origin = Object.entries(event?.headers ?? {})
      .find(([name]) => name.toLowerCase() === "origin")?.[1];
    if ((origin !== undefined && !ALLOWED_ORIGINS.has(origin)) || (method === "POST" && origin === undefined)) {
      return response(403, { error: "Origin not allowed" });
    }

    if ((event?.body !== undefined && event.body !== null && event.body !== "") ||
        event?.rawQueryString || Object.keys(event?.queryStringParameters ?? {}).length > 0) {
      return response(400, { error: "This counter does not accept input" });
    }

    try {
      const count = await (method === "POST" ? store.increment() : store.getCount());
      if (!Number.isSafeInteger(count) || count < 0) {
        const error = new Error("Invalid aggregate count");
        error.name = "InvalidCounterValue";
        throw error;
      }
      return response(200, { count });
    } catch (error) {
      // Do not log request headers, bodies, IP addresses, or other visitor data.
      logger.error(JSON.stringify({
        event: "visit_counter_failed",
        operation: method === "POST" ? "increment" : "read",
        error: typeof error?.name === "string" ? error.name : "UnknownError",
      }));
      return response(503, { error: "Visit count unavailable" });
    }
  };
}

let dynamo;

function getDynamo() {
  if (!dynamo) {
    const table = process.env.VISITS_TABLE;
    if (!table) throw new Error("VISITS_TABLE is not configured");
    // Lambda's Node.js runtime supplies AWS SDK v3; no browser credentials exist.
    const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
    dynamo = {
      table,
      GetItemCommand,
      UpdateItemCommand,
      // An ambiguous write failure must not silently increment a second time.
      client: new DynamoDBClient({ maxAttempts: 1 }),
    };
  }
  return dynamo;
}

const store = {
  async getCount() {
    const { client, table, GetItemCommand } = getDynamo();
    const result = await client.send(new GetItemCommand({
      TableName: table,
      Key: { site: { S: SITE } },
      ProjectionExpression: "#count",
      ExpressionAttributeNames: { "#count": "count" },
      ConsistentRead: true,
    }), { abortSignal: AbortSignal.timeout(4000) });
    if (!result.Item) return 0;
    const value = result.Item.count?.N;
    return typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  },

  async increment() {
    const { client, table, UpdateItemCommand } = getDynamo();
    const result = await client.send(new UpdateItemCommand({
      TableName: table,
      Key: { site: { S: SITE } },
      UpdateExpression: "ADD #count :one",
      ExpressionAttributeNames: { "#count": "count" },
      ExpressionAttributeValues: { ":one": { N: "1" } },
      ReturnValues: "ALL_NEW",
    }), { abortSignal: AbortSignal.timeout(4000) });
    const value = result.Attributes?.count?.N;
    return typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  },
};

exports.createHandler = createHandler;
exports.handler = createHandler({ store });
