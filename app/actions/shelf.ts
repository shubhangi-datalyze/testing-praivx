"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isShelf } from "@/lib/shelves";
import { track } from "@/lib/analytics/server";

export async function addToShelf(form: FormData) {
  const user = await requireUser();
  const bookId = String(form.get("bookId") ?? "");
  const shelf = form.get("shelf");
  if (!isShelf(shelf)) throw new Error("Unknown shelf");

  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error("Book not found");

  await db.shelfItem.upsert({
    where: { userId_bookId: { userId: user.id, bookId } },
    create: { userId: user.id, bookId, shelf, finishedAt: shelf === "finished" ? new Date() : null },
    update: { shelf, finishedAt: shelf === "finished" ? new Date() : null },
  });

  await track(user.id, "book_added", { book_id: bookId, shelf, genre: book.genre, source: "book_page" });

  revalidatePath("/shelves");
  redirect(`/books/${bookId}?added=${shelf}`);
}

export async function moveShelf(form: FormData) {
  const user = await requireUser();
  const itemId = String(form.get("itemId") ?? "");
  const shelf = form.get("shelf");
  if (!isShelf(shelf)) throw new Error("Unknown shelf");

  const item = await db.shelfItem.findFirst({ where: { id: itemId, userId: user.id } });
  if (!item) throw new Error("Shelf item not found");

  await db.shelfItem.update({
    where: { id: item.id },
    data: {
      shelf,
      finishedAt: shelf === "finished" ? (item.finishedAt ?? new Date()) : null,
    },
  });
  await track(user.id, "book_shelf_changed", { book_id: item.bookId, from_shelf: item.shelf, to_shelf: shelf });
  revalidatePath("/shelves");
}

export async function removeFromShelf(form: FormData) {
  const user = await requireUser();
  const itemId = String(form.get("itemId") ?? "");
  await db.shelfItem.deleteMany({ where: { id: itemId, userId: user.id } });
  await track(user.id, "book_removed", { item_id: itemId });
  revalidatePath("/shelves");
}
