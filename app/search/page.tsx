import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { quickAdd } from "@/app/actions/search";
import { requireUser } from "@/lib/auth";
import { SearchTracker } from "@/components/analytics/search-tracker";
import { db } from "@/lib/db";
import { GENRES, shelfLabel } from "@/lib/shelves";

type Params = { q?: string; genre?: string; year?: string; author?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requireUser();
  const { q = "", genre = "", year = "", author = "" } = await searchParams;

  const where: Prisma.BookWhereInput = {};
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (genre) where.genre = genre;
  if (author) where.author = author;
  if (year && Number(year)) where.year = Number(year);

  const [books, authors, years, mine] = await Promise.all([
    db.book.findMany({ where, orderBy: { title: "asc" } }),
    db.book.findMany({ distinct: ["author"], select: { author: true }, orderBy: { author: "asc" } }),
    db.book.findMany({ distinct: ["year"], select: { year: true }, orderBy: { year: "desc" } }),
    db.shelfItem.findMany({ where: { userId: user.id }, select: { bookId: true, shelf: true } }),
  ]);
  const onShelf = new Map(mine.map((m) => [m.bookId, m.shelf]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search books</h1>
      <form className="grid gap-3 sm:grid-cols-5" method="get">
        <input className="input sm:col-span-2" name="q" placeholder="Title" defaultValue={q} />
        <select className="input" name="genre" defaultValue={genre}>
          <option value="">Any genre</option>
          {GENRES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select className="input" name="year" defaultValue={year}>
          <option value="">Any year</option>
          {years.map((y) => (
            <option key={y.year}>{y.year}</option>
          ))}
        </select>
        <select className="input" name="author" defaultValue={author}>
          <option value="">Any author</option>
          {authors.map((a) => (
            <option key={a.author}>{a.author}</option>
          ))}
        </select>
        <button className="btn sm:col-span-5 sm:w-fit">Search</button>
      </form>

      <SearchTracker query={q} genre={genre} year={year} author={author} results={books.length} />
      <p className="text-sm text-neutral-500">{books.length} results</p>
      <ul className="divide-y divide-neutral-200">
        {books.map((b) => {
          const shelf = onShelf.get(b.id);
          return (
            <li key={b.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <Link href={`/books/${b.id}`} className="font-medium underline">
                  {b.title}
                </Link>
                <p className="text-sm text-neutral-600">
                  {b.author} · {b.genre} · {b.year}
                </p>
              </div>
              {shelf ? (
                <span className="text-sm text-neutral-500">On {shelfLabel(shelf)}</span>
              ) : (
                <form action={quickAdd}>
                  <input type="hidden" name="bookId" value={b.id} />
                  <button className="btn-secondary">+ Want to read</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
