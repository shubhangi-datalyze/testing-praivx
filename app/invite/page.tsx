import { sendInvite } from "@/app/actions/invites";
import { FormError } from "@/components/form-error";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const user = await requireUser();
  const { error, sent } = await searchParams;
  const invites = await db.invite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Invite a friend</h1>
      <FormError message={error} />
      {sent && <p className="text-sm text-green-700">Invite saved.</p>}
      <form action={sendInvite} className="space-y-4">
        <input type="hidden" name="meta" value={user.email} />
        <div>
          <label className="label" htmlFor="email">Friend&apos;s email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="note">Note (optional)</label>
          <textarea className="input" id="note" name="note" rows={3} />
        </div>
        <button className="btn">Send invite</button>
      </form>

      {invites.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Sent invites</h2>
          <ul className="text-sm text-neutral-700">
            {invites.map((i) => (
              <li key={i.id}>
                {i.email} · {i.createdAt.toLocaleDateString()}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
