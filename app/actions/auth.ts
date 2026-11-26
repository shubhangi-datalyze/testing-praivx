"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { track } from "@/lib/analytics/server";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

export async function signup(form: FormData) {
  const email = field(form, "email").toLowerCase();
  const password = field(form, "password");
  const name = field(form, "name") || null;
  const planIntent = field(form, "plan") || null;

  if (!email.includes("@")) redirect("/signup?error=Enter+a+valid+email");
  if (password.length < 8) redirect("/signup?error=Password+must+be+at+least+8+characters");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) redirect("/signup?error=An+account+with+that+email+already+exists");

  const user = await db.user.create({
    data: { email, name, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  await track(email, "user_signed_up", { method: "email", plan_intent: planIntent, has_name: !!name });
  redirect("/onboarding/genres");
}

export async function login(form: FormData) {
  const email = field(form, "email").toLowerCase();
  const password = field(form, "password");

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=Wrong+email+or+password");
  }
  await createSession(user.id);
  await track(user.id, "user_logged_in", { onboarding_step: user.onboardingStep, resumed_onboarding: user.onboardingStep < 4 });
  redirect(user.onboardingStep < 4 ? onboardingPath(user.onboardingStep) : "/shelves");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

function onboardingPath(step: number) {
  return ["/onboarding/genres", "/onboarding/goal", "/onboarding/first-book"][step - 1] ?? "/shelves";
}
