"use client";

import posthog from "posthog-js";

export const CONSENT_KEY = "shelfie_consent";
export type Consent = "granted" | "denied";

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === "granted" || v === "denied" ? v : null;
}

export function saveConsent(value: Consent) {
  window.localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new Event("shelfie:consent"));
}

/** Client-side events. Does nothing until analytics has started (after consent). */
export function capture(event: string, properties: Record<string, unknown> = {}) {
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}

/** Sends an event through our own endpoint, so ad blockers don't drop it. */
export function forward(event: string, properties: Record<string, unknown> = {}) {
  const distinct_id = posthog.__loaded ? posthog.get_distinct_id() : "anonymous";
  void fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event, distinct_id, properties }),
    keepalive: true,
  });
}

export { posthog };
