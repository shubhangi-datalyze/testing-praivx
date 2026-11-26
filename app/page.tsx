import { TrackLink } from "@/components/analytics/track-link";
import { getCurrentUser } from "@/lib/auth";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    features: ["Three shelves", "Search 50+ books", "Yearly reading goal"],
  },
  {
    name: "Pro",
    price: "$5 / month",
    features: ["Everything in Free", "Ratings and reviews", "Weekly goal reminders", "Mobile app access"],
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const cta = user ? "/shelves" : "/signup?plan=pro";

  return (
    <div className="space-y-12">
      <section className="space-y-4 pt-6">
        <h1 className="text-3xl font-bold">Keep track of every book you read.</h1>
        <p className="max-w-xl text-neutral-600">
          Shelfie gives you three shelves, a yearly reading goal and a place to review what you
          finished. Invite a friend and compare notes.
        </p>
        <TrackLink href={cta} className="btn" event="cta_clicked" properties={{ cta: "hero", plan: "pro", is_logged_in: !!user }}>
          Start free trial
        </TrackLink>
      </section>

      <section id="pricing">
        <h2 className="mb-4 text-xl font-semibold">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <div key={plan.name} className="card space-y-3">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-2xl font-bold">{plan.price}</p>
              <ul className="list-disc pl-5 text-sm text-neutral-700">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <TrackLink
                href={user ? (plan.name === "Pro" ? "/checkout" : "/shelves") : `/signup?plan=${plan.name.toLowerCase()}`}
                className="btn-secondary"
                event="cta_clicked"
                properties={{ cta: "plan_card", plan: plan.name, is_logged_in: !!user }}
              >
                {plan.name === "Pro" ? "Start free trial" : "Get started"}
              </TrackLink>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
