import { NextResponse } from "next/server";
import { track } from "@/lib/analytics/server";

const ALLOWED = new Set(["search_performed"]);

/** First-party relay for client events that ad blockers tend to drop. */
export async function POST(req: Request) {
  let body: { event?: string; distinct_id?: string; properties?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.event || !ALLOWED.has(body.event)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }
  await track(body.distinct_id || "anonymous", body.event, { ...body.properties, $lib: "shelfie-relay" });
  return NextResponse.json({ ok: true });
}
