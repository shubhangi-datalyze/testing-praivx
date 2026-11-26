import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PRO_PRICE_CENTS } from "@/lib/shelves";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const user = await requireUser();
  if (user.plan === "pro") redirect("/settings");

  return (
    <div className="max-w-sm">
      <h1 className="mb-2 text-2xl font-bold">Upgrade to Pro</h1>
      <p className="mb-6 text-sm text-neutral-600">
        ${(PRO_PRICE_CENTS / 100).toFixed(2)} per month. Cancel any time.
      </p>
      <CheckoutForm userId={user.id} amountCents={PRO_PRICE_CENTS} />
    </div>
  );
}
