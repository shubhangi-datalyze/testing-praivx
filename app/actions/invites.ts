"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { track } from "@/lib/analytics/server";

export async function sendInvite(form: FormData) {
  const user = await requireUser();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const note = String(form.get("note") ?? "").trim().slice(0, 500);
  const meta = String(form.get("meta") ?? "");

  if (!email.includes("@")) redirect("/invite?error=Enter+your+friend%27s+email");
  if (email === user.email) redirect("/invite?error=You+can%27t+invite+yourself");

  await db.invite.create({ data: { userId: user.id, email, note } });

  await track(user.id, "invite_sent", { invitee_email: email, has_note: note.length > 0, meta });

  redirect("/invite?sent=1");
}
