import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { ConsentBanner } from "@/components/analytics/consent-banner";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Shelfie",
  description: "Track what you read, set a yearly goal, and share books with friends.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const sessionUser = user
    ? { id: user.id, email: user.email, plan: user.plan, createdAt: user.createdAt.toISOString() }
    : null;
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <Suspense fallback={null}>
          <AnalyticsProvider user={sessionUser} />
        </Suspense>
        <ConsentBanner />
      </body>
    </html>
  );
}
