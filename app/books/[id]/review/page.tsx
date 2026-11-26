import { notFound, redirect } from "next/navigation";
import { saveReview } from "@/app/actions/reviews";
import { FormError } from "@/components/form-error";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  const book = await db.book.findUnique({ where: { id } });
  if (!book) notFound();
  const item = await db.shelfItem.findUnique({
    where: { userId_bookId: { userId: user.id, bookId: id } },
  });
  if (item?.shelf !== "finished") redirect(`/books/${id}`);
  const review = await db.review.findUnique({
    where: { userId_bookId: { userId: user.id, bookId: id } },
  });

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-2xl font-bold">Review {book.title}</h1>
      <FormError message={error} />
      <form action={saveReview} className="space-y-4">
        <input type="hidden" name="bookId" value={book.id} />
        <fieldset>
          <legend className="label">Rating</legend>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex items-center gap-1 text-sm">
                <input type="radio" name="rating" value={n} defaultChecked={review?.rating === n} required />
                {n}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="body">Review</label>
          <textarea className="input" id="body" name="body" rows={6} defaultValue={review?.body ?? ""} />
        </div>
        <button className="btn">Save review</button>
      </form>
    </div>
  );
}
