import { saveGenres } from "@/app/actions/onboarding";
import { FormError } from "@/components/form-error";
import { requireUser } from "@/lib/auth";
import { GENRES } from "@/lib/shelves";
import { Steps } from "../steps";

export default async function GenresStep({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;
  const chosen = new Set(user.favoriteGenres.split(",").filter(Boolean));

  return (
    <div className="max-w-lg">
      <Steps current={1} />
      <h1 className="mb-4 text-2xl font-bold">What do you like to read?</h1>
      <FormError message={error} />
      <form action={saveGenres} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {GENRES.map((g) => (
            <label key={g} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="genres" value={g} defaultChecked={chosen.has(g)} />
              {g}
            </label>
          ))}
        </div>
        <button className="btn">Continue</button>
      </form>
    </div>
  );
}
