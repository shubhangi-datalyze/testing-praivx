import { redirect } from "next/navigation";
import { cancelSubscription } from "@/app/actions/subscription";
import { FormError } from "@/components/form-error";
import { requireUser } from "@/lib/auth";

const REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "not_using", label: "I'm not using it" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "other", label: "Other" },
];

export default async function CancelPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  if (user.plan !== "pro") redirect("/settings");
  const { error } = await searchParams;

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-2xl font-bold">Cancel Pro</h1>
      <FormError message={error} />
      <form action={cancelSubscription} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="label">Why are you canceling?</legend>
          {REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="reason" value={r.value} required />
              {r.label}
            </label>
          ))}
        </fieldset>
        <div>
          <label className="label" htmlFor="detail">Anything else? (required for Other)</label>
          <textarea className="input" id="detail" name="detail" rows={3} />
        </div>
        <button className="btn">Cancel subscription</button>
      </form>
    </div>
  );
}
