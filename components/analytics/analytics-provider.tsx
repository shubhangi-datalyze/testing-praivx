"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { posthog, readConsent } from "@/lib/analytics/client";

type SessionUser = { id: string; email: string; plan: string; createdAt: string } | null;

export function AnalyticsProvider({ user }: { user: SessionUser }) {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function start() {
      if (readConsent() !== "granted" || posthog.__loaded) return;
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (!key) return;
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true,
        autocapture: false,
        loaded: (ph) => {
          ph.register({ platform: "web", app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev" });
          setReady(true);
        },
      });
    }
    start();
    window.addEventListener("shelfie:consent", start);
    return () => window.removeEventListener("shelfie:consent", start);
  }, []);

  useEffect(() => {
    if (!ready) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [ready, pathname, searchParams]);

  useEffect(() => {
    if (!ready || !user) return;
    posthog.identify(user.id, { email: user.email, plan: user.plan, signed_up_at: user.createdAt });
  }, [ready, user]);

  return null;
}
