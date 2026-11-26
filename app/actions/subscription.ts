"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { track } from "@/lib/analytics/server";

const REASONS = ["too_expensive", "not_using", "missing_features", "other"] as const;

export async function cancelSubscription(form: FormData) {
  const user = await requireUser();
  const reason = String(form.get("reason") ?? "");
  const detail = String(form.get("detail") ?? "").trim().slice(0, 1000);

  if (!(REASONS as readonly string[]).includes(reason)) {
    redirect("/settings/cancel?error=Pick+a+reason");
  }
  if (reason === "other" && !detail) {
    redirect("/settings/cancel?error=Tell+us+a+little+more");
  }

  const subscription = await db.subscription.findFirst({
    where: { userId: user.id, status: "active" },
    orderBy: { startedAt: "desc" },
  });
  if (!subscription) redirect("/settings");

  await db.$transaction([
    db.subscription.update({
      where: { id: subscription.id },
      data: { status: "canceled", canceledAt: new Date(), cancelReason: reason, cancelDetail: detail || null },
    }),
    db.user.update({ where: { id: user.id }, data: { plan: "free" } }),
  ]);
  await track(user.id, "subscription_canceled", {
    reason,
    detail,
    days_subscribed: Math.floor((Date.now() - subscription.startedAt.getTime()) / 86_400_000),
  });
  redirect("/settings?canceled=1");
}
