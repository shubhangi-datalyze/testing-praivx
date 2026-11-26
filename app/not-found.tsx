import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Not found</h1>
      <Link href="/" className="underline">Back home</Link>
    </div>
  );
}
