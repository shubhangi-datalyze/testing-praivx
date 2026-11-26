import Link from "next/link";
import { moveShelf, removeFromShelf } from "@/app/actions/shelf";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SHELVES } from "@/lib/shelves";

export default async function ShelvesPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await requireUser();
  const { welcome } = await searchParams;
  const items = await db.shelfItem.findMany({
    where: { userId: user.id },
    include: { book: true },
    orderBy: { addedAt: "desc" },
  });
  const finishedThisYear = items.filter(
    (i) => i.shelf === "finished" && i.finishedAt && i.finishedAt.getFullYear() === new Date().getFullYear(),
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My shelves</h1>
        {welcome && <p className="text-sm text-green-700">You are all set. Happy reading.</p>}
        <p className="text-sm text-neutral-600">
          {finishedThisYear} of {user.yearlyGoal} books finished this year.
        </p>
      </div>

      {SHELVES.map((shelf) => {
        const onShelf = items.filter((i) => i.shelf === shelf.id);
        return (
          <section key={shelf.id}>
            <h2 className="mb-2 text-lg font-semibold">
              {shelf.label} <span className="text-neutral-400">({onShelf.length})</span>
            </h2>
            {onShelf.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Nothing here yet. <Link href="/search" className="underline">Find a book</Link>.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {onShelf.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 py-2">
                    <Link href={`/books/${item.bookId}`} className="flex-1 underline">
                      {item.book.title}
                    </Link>
                    <form action={moveShelf} className="flex gap-2">
                      <input type="hidden" name="itemId" value={item.id} />
                      <select className="input w-auto" name="shelf" defaultValue={item.shelf}>
                        {SHELVES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <button className="btn-secondary">Move</button>
                    </form>
                    {item.shelf === "finished" && (
                      <Link href={`/books/${item.bookId}/review`} className="btn-secondary">
                        Review
                      </Link>
                    )}
                    <form action={removeFromShelf}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button className="btn-secondary text-red-700">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
