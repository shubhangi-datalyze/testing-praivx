import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export async function Nav() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-neutral-200">
      <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm">
        <Link href="/" className="font-semibold">
          Shelfie
        </Link>
        {user ? (
          <>
            <Link href="/search">Search</Link>
            <Link href="/shelves">My shelves</Link>
            <Link href="/invite">Invite</Link>
            <Link href="/settings">Settings</Link>
            <span className="ml-auto text-neutral-500">
              {user.email}
              {user.plan === "pro" && " · Pro"}
            </span>
            <form action={logout}>
              <button className="btn-secondary">Log out</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="ml-auto">
              Log in
            </Link>
            <Link href="/signup" className="btn">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
