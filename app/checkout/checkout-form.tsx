"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { capture } from "@/lib/analytics/client";

export function CheckoutForm({ userId, amountCents }: { userId: string; amountCents: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    capture("checkout_started", { plan: "pro", amount: (amountCents / 100).toFixed(2) });
  }, [amountCents]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const card = String(form.get("card") ?? "").replace(/\s+/g, "");
    if (!/^\d{16}$/.test(card)) {
      setError("Card number must be 16 digits.");
      capture("checkout_failed", { reason: "invalid_card", card_last4: card.slice(-4) });
      return;
    }

    capture("checkout_completed", { plan: "pro", amount_cents: amountCents });
    setPending(true);
    // Stand-in for a payment provider: "charge" the card, then deliver the
    // provider's webhook to our own endpoint.
    const res = await fetch("/api/payments/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "payment.succeeded",
        data: {
          id: `pay_${crypto.randomUUID()}`,
          userId,
          amountCents,
          currency: "usd",
          last4: card.slice(-4),
        },
      }),
    });
    setPending(false);

    if (!res.ok) {
      setError("Payment failed. Try again.");
      capture("checkout_failed", { reason: "payment_failed" });
      return;
    }
    router.push("/settings?upgraded=1");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="label" htmlFor="card">Card number</label>
        <input className="input" id="card" name="card" inputMode="numeric" placeholder="4242 4242 4242 4242" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="exp">Expiry</label>
          <input className="input" id="exp" name="exp" placeholder="12/30" required />
        </div>
        <div>
          <label className="label" htmlFor="cvc">CVC</label>
          <input className="input" id="cvc" name="cvc" placeholder="123" required />
        </div>
      </div>
      <button className="btn w-full" disabled={pending}>
        {pending ? "Processing..." : "Pay and upgrade"}
      </button>
    </form>
  );
}
