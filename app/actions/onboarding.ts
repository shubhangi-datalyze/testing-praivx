"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { GENRES } from "@/lib/shelves";
import { logEvent } from "@/lib/logging/logEvent";
import { track } from "@/lib/analytics/server";

export async function saveGenres(form: FormData) {
  const user = await requireUser();
  const picked = form
    .getAll("genres")
    .map(String)
    .filter((g) => (GENRES as readonly string[]).includes(g));

  if (picked.length === 0) redirect("/onboarding/genres?error=Pick+at+least+one+genre");

  await db.user.update({
    where: { id: user.id },
    data: { favoriteGenres: picked.join(","), onboardingStep: Math.max(user.onboardingStep, 2) },
  });
  await track(user.id, "onboarding_step_completed", { step: 1, step_name: "genres", genres: picked, genre_count: picked.length });
  redirect("/onboarding/goal");
}

export async function saveGoal(form: FormData) {
  const user = await requireUser();
  const goal = Number(form.get("yearlyGoal"));
  if (!Number.isInteger(goal) || goal < 1 || goal > 365) {
    redirect("/onboarding/goal?error=Choose+a+goal+between+1+and+365");
  }

  await db.user.update({
    where: { id: user.id },
    data: { yearlyGoal: goal, onboardingStep: Math.max(user.onboardingStep, 3) },
  });
  await track(user.id, "onboarding_step_completed", { step: form.get("step") ?? 2, step_name: "goal", yearly_goal: goal });
  redirect("/onboarding/first-book");
}

export async function addFirstBook(form: FormData) {
  const user = await requireUser();
  const bookId = String(form.get("bookId") ?? "");
  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book) redirect("/onboarding/first-book?error=Pick+a+book+to+start+with");

  await db.shelfItem.upsert({
    where: { userId_bookId: { userId: user.id, bookId: book.id } },
    create: { userId: user.id, bookId: book.id, shelf: "reading" },
    update: { shelf: "reading" },
  });
  await db.user.update({ where: { id: user.id }, data: { onboardingStep: 4 } });

  logEvent("book-added", { userId: user.id, bookId: book.id, shelf: "reading", source: "onboarding" });
  const completed = { book_id: book.id, genre: book.genre };

  redirect("/shelves?welcome=1");
  await track(user.id, "onboarding_completed", completed);
}
