"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { track } from "@/lib/analytics/server";

export async function saveReview(form: FormData) {
  const user = await requireUser();
  const bookId = String(form.get("bookId") ?? "");
  const rating = Number(form.get("rating"));
  const body = String(form.get("body") ?? "").trim().slice(0, 5000);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`/books/${bookId}/review?error=Pick+a+rating+from+1+to+5`);
  }

  const item = await db.shelfItem.findUnique({
    where: { userId_bookId: { userId: user.id, bookId } },
  });
  if (item?.shelf !== "finished") {
    redirect(`/books/${bookId}/review?error=Finish+the+book+before+reviewing+it`);
  }

  await db.review.upsert({
    where: { userId_bookId: { userId: user.id, bookId } },
    create: { userId: user.id, bookId, rating, body },
    update: { rating, body },
  });
  await track(user.id, "review_submitted", { book_id: bookId, rating, review: body, has_text: body.length > 0 });
  redirect(`/books/${bookId}?reviewed=1`);
}
