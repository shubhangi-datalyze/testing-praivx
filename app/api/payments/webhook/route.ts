import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { track } from "@/lib/analytics/server";

type PaymentEvent = {
  type: string;
  data?: {
    id?: string;
    userId?: string;
    amountCents?: number;
    currency?: string;
  };
};

export async function POST(req: Request) {
  let event: PaymentEvent;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "payment.succeeded") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const { id, userId, amountCents, currency = "usd" } = event.data ?? {};
  if (!id || !userId || typeof amountCents !== "number") {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Unknown user" }, { status: 404 });

  await track(userId, "payment_succeeded", { payment_id: id, amount_cents: amountCents, currency, plan: "pro" });

  const duplicate = await db.payment.findUnique({ where: { externalId: id } });
  if (duplicate) return NextResponse.json({ received: true, duplicate: true });

  await db.$transaction([
    db.payment.create({
      data: { userId, externalId: id, amountCents, currency, status: "succeeded" },
    }),
    db.subscription.create({ data: { userId, plan: "pro", status: "active" } }),
    db.user.update({ where: { id: userId }, data: { plan: "pro" } }),
  ]);

  return NextResponse.json({ received: true, plan: "pro" });
}
