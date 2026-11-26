import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { SHELVES } from "@/lib/shelves";
import { track } from "@/lib/analytics/server";

export async function GET(req: Request) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.shelfItem.findMany({
    where: { userId: user.id },
    include: { book: true },
    orderBy: { addedAt: "desc" },
  });

  await track(user.id, "mobile_shelves_fetched", { book_count: items.length, platform: "ios" });

  return NextResponse.json({
    shelves: SHELVES.map((s) => ({
      id: s.id,
      label: s.label,
      books: items
        .filter((i) => i.shelf === s.id)
        .map((i) => ({
          itemId: i.id,
          bookId: i.book.id,
          title: i.book.title,
          author: i.book.author,
          addedAt: i.addedAt,
          finishedAt: i.finishedAt,
        })),
    })),
  });
}
