"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { track } from "@/lib/analytics/server";

/** One-click add from the search results: goes straight to "Want to read". */
export async function quickAdd(form: FormData) {
  const user = await requireUser();
  const bookId = String(form.get("bookId") ?? "");
  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error("Book not found");

  const existing = await db.shelfItem.findUnique({
    where: { userId_bookId: { userId: user.id, bookId } },
  });
  if (!existing) {
    await db.shelfItem.create({ data: { userId: user.id, bookId, shelf: "want_to_read" } });
    await track(user.id, "book_added", { book_id: bookId, shelf: "want_to_read", source: "search" });
  }

  revalidatePath("/search");
  revalidatePath("/shelves");
}
