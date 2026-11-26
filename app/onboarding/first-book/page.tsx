import { addFirstBook } from "@/app/actions/onboarding";
import { FormError } from "@/components/form-error";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Steps } from "../steps";

export default async function FirstBookStep({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  const genres = user.favoriteGenres.split(",").filter(Boolean);
  const books = await db.book.findMany({
    where: genres.length ? { genre: { in: genres } } : undefined,
    orderBy: { year: "desc" },
    take: 8,
  });

  return (
    <div className="max-w-lg">
      <Steps current={3} />
      <h1 className="mb-4 text-2xl font-bold">Add your first book</h1>
      <FormError message={error} />
      <form action={addFirstBook} className="space-y-4">
        <ul className="space-y-2">
          {books.map((b) => (
            <li key={b.id}>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="bookId" value={b.id} required />
                <span>
                  <strong>{b.title}</strong> by {b.author} ({b.year})
                </span>
              </label>
            </li>
          ))}
        </ul>
        <button className="btn">Add to Reading and finish</button>
      </form>
    </div>
  );
}
