import Link from "next/link";
import { redirect } from "next/navigation";
import { signup } from "@/app/actions/auth";
import { FormError } from "@/components/form-error";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plan?: string }>;
}) {
  if (await getCurrentUser()) redirect("/shelves");
  const { error, plan } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-bold">Create your account</h1>
      {plan === "pro" && (
        <p className="mb-4 text-sm text-neutral-600">You can upgrade to Pro after onboarding.</p>
      )}
      <FormError message={error} />
      <form action={signup} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input className="input" id="name" name="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" minLength={8} required />
        </div>
        <button className="btn w-full">Sign up</button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account? <Link href="/login" className="underline">Log in</Link>
      </p>
    </div>
  );
}
