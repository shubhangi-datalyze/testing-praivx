import Link from "next/link";
import { deleteAccount, updateGoal } from "@/app/actions/settings";
import { FormError } from "@/components/form-error";
import { requireUser } from "@/lib/auth";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; upgraded?: string; canceled?: string }>;
}) {
  const user = await requireUser();
  const { error, saved, upgraded, canceled } = await searchParams;

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <FormError message={error} />
      {saved && <p className="text-sm text-green-700">Goal updated.</p>}
      {upgraded && <p className="text-sm text-green-700">Welcome to Pro.</p>}
      {canceled && <p className="text-sm text-green-700">Your subscription is canceled.</p>}

      <section className="card space-y-3">
        <h2 className="font-semibold">Plan</h2>
        <p className="text-sm">You are on the {user.plan === "pro" ? "Pro" : "Free"} plan.</p>
        {user.plan === "pro" ? (
          <Link href="/settings/cancel" className="btn-secondary">Cancel subscription</Link>
        ) : (
          <Link href="/checkout" className="btn">Upgrade to Pro</Link>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Yearly reading goal</h2>
        <form action={updateGoal} className="flex items-end gap-3">
          <input
            className="input max-w-32"
            name="yearlyGoal"
            type="number"
            min={1}
            max={365}
            defaultValue={user.yearlyGoal}
            aria-label="Yearly reading goal"
            required
          />
          <button className="btn">Save</button>
        </form>
      </section>

      <section className="card border-red-200">
        <h2 className="mb-2 font-semibold text-red-700">Delete account</h2>
        <p className="mb-3 text-sm text-neutral-600">
          This removes your shelves, reviews and invites. Type DELETE to confirm.
        </p>
        <form action={deleteAccount} className="flex items-end gap-3">
          <input className="input max-w-40" name="confirm" aria-label="Type DELETE" required />
          <button className="btn bg-red-700 hover:bg-red-600">Delete account</button>
        </form>
      </section>
    </div>
  );
}
