"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { destroySession, requireUser } from "@/lib/auth";
import { track } from "@/lib/analytics/server";

export async function updateGoal(form: FormData) {
  const user = await requireUser();
  const goal = Number(form.get("yearlyGoal"));
  if (!Number.isInteger(goal) || goal < 1 || goal > 365) {
    redirect("/settings?error=Choose+a+goal+between+1+and+365");
  }
  await db.user.update({ where: { id: user.id }, data: { yearlyGoal: goal } });
  await track(user.id, "reading_goal_updated", { old_goal: user.yearlyGoal, new_goal: goal });
  redirect("/settings?saved=1");
}

export async function deleteAccount(form: FormData) {
  const user = await requireUser();
  if (String(form.get("confirm") ?? "") !== "DELETE") {
    redirect("/settings?error=Type+DELETE+to+confirm");
  }
  await track(user.id, "account_deleted", {
    plan: user.plan,
    days_since_signup: Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000),
  });
  await destroySession();
  await db.user.delete({ where: { id: user.id } });
  redirect("/?deleted=1");
}
