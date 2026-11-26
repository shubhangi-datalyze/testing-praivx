import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { FormError } from "@/components/form-error";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/shelves");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-2xl font-bold">Log in</h1>
      <FormError message={error} />
      <form action={login} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" required />
        </div>
        <button className="btn w-full">Log in</button>
      </form>
      <p className="mt-4 text-sm">
        New here? <Link href="/signup" className="underline">Create an account</Link>
      </p>
    </div>
  );
}
