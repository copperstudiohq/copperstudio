"use client";

import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import counterConfig from "@/config/visits.json";

const sessionKey = "copperstudio:visit-counted:v1";
let visitRequest: Promise<number> | undefined;

type CounterState =
  | { status: "loading" }
  | { status: "ready"; count: number }
  | { status: "unavailable" };

async function requestCount(method: "GET" | "POST"): Promise<number> {
  if (!counterConfig.endpoint.startsWith("https://")) {
    throw new Error("Visit counter endpoint is not configured.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(counterConfig.endpoint, {
      method,
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Visit counter returned HTTP ${response.status}.`);

    const data: unknown = await response.json();
    if (
      typeof data !== "object" || data === null || !("count" in data) ||
      typeof data.count !== "number" || !Number.isSafeInteger(data.count) || data.count < 0
    ) {
      throw new Error("Visit counter returned an invalid count.");
    }
    return data.count;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function loadCount(): Promise<number> {
  let alreadyCounted = false;
  try {
    alreadyCounted = sessionStorage.getItem(sessionKey) === "1";
    // Mark before sending: an uncertain POST response must not cause a second count.
    if (!alreadyCounted) sessionStorage.setItem(sessionKey, "1");
  } catch {
    // Storage can be disabled. The shared promise still counts once per page load.
  }

  if (alreadyCounted) return requestCount("GET");
  try {
    return await requestCount("POST");
  } catch {
    // A POST may have reached the server even if its response was lost.
    return requestCount("GET");
  }
}

export default function VisitCounter() {
  const [state, setState] = useState<CounterState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    // React can remount effects. Reuse the in-flight request instead of incrementing twice.
    visitRequest ??= loadCount();
    visitRequest.then(
      (count) => { if (active) setState({ status: "ready", count }); },
      (error: unknown) => {
        if (active) {
          console.warn("Website visit counter is unavailable.", error);
          setState({ status: "unavailable" });
        }
      },
    );
    return () => { active = false; };
  }, []);

  return (
    <span
      className="visit-counter"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      title="Website visits. Refreshes in the same tab count once."
    >
      <Eye size={14} aria-hidden="true" />
      {state.status === "ready" ? (
        <span><strong>{new Intl.NumberFormat("en-GB").format(state.count)}</strong> {state.count === 1 ? "visit" : "visits"}</span>
      ) : state.status === "unavailable" ? (
        <span>Visits unavailable</span>
      ) : (
        <span aria-label="Loading website visits">— visits</span>
      )}
    </span>
  );
}
