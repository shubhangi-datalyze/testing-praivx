import Link from "next/link";
import { notFound } from "next/navigation";
import { addToShelf } from "@/app/actions/shelf";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SHELVES, shelfLabel } from "@/lib/shelves";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; reviewed?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { added, reviewed } = await searchParams;

  const book = await db.book.findUnique({ where: { id } });
  if (!book) notFound();

  const [item, review] = await Promise.all([
    db.shelfItem.findUnique({ where: { userId_bookId: { userId: user.id, bookId: id } } }),
    db.review.findUnique({ where: { userId_bookId: { userId: user.id, bookId: id } } }),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{book.title}</h1>
        <p className="text-neutral-600">
          {book.author} · {book.genre} · {book.year} · {book.pages} pages
        </p>
      </div>
      {added && <p className="text-sm text-green-700">Saved to {shelfLabel(added)}.</p>}
      {reviewed && <p className="text-sm text-green-700">Review saved.</p>}

      <form action={addToShelf} className="flex items-end gap-3">
        <input type="hidden" name="bookId" value={book.id} />
        <div>
          <label className="label" htmlFor="shelf">Shelf</label>
          <select className="input" id="shelf" name="shelf" defaultValue={item?.shelf ?? "want_to_read"}>
            {SHELVES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn">{item ? "Update shelf" : "Add to shelf"}</button>
      </form>

      {item?.shelf === "finished" && (
        <div className="card">
          {review ? (
            <p className="text-sm">
              Your rating: {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
              {review.body && <span className="mt-2 block text-neutral-700">{review.body}</span>}
            </p>
          ) : (
            <p className="text-sm">You finished this one.</p>
          )}
          <Link href={`/books/${book.id}/review`} className="btn-secondary mt-3">
            {review ? "Edit review" : "Rate and review"}
          </Link>
        </div>
      )}
    </div>
  );
}
