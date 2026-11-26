import { PostHog } from "posthog-node";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let client: PostHog | null = null;

function posthog() {
  if (!key) return null;
  client ??= new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
  return client;
}

type Props = Record<string, unknown>;

/**
 * Sends a product event from the server. Awaited so the event is out before a
 * serverless function returns. Call it before `redirect()`, which throws.
 */
export async function track(distinctId: string, event: string, properties: Props = {}) {
  const ph = posthog();
  if (!ph) return;
  try {
    await ph.captureImmediate({
      distinctId,
      event,
      properties: { ...properties, app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev" },
    });
  } catch (err) {
    console.error(`[analytics] ${event} failed`, err);
  }
}
