"use client";

import { useEffect, useState } from "react";
import { readConsent, saveConsent } from "@/lib/analytics/client";

export function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readConsent() === null);
  }, []);

  if (!open) return null;

  function choose(value: "granted" | "denied") {
    saveConsent(value);
    setOpen(false);
  }

  return (
    <div role="dialog" aria-label="Cookie consent" className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white px-4 py-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 text-sm">
        <p className="flex-1">
          We use cookies to understand how Shelfie is used and to make it better. You can say no and everything still works.
        </p>
        <button className="btn-secondary" onClick={() => choose("denied")}>Decline</button>
        <button className="btn" onClick={() => choose("granted")}>Accept cookies</button>
      </div>
    </div>
  );
}
