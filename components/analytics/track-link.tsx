"use client";

import Link from "next/link";
import { capture } from "@/lib/analytics/client";

export function TrackLink(props: { href: string; className?: string; event: string; properties?: Record<string, unknown>; children: React.ReactNode }) {
  const { href, className, event, properties, children } = props;
  return (
    <Link href={href} className={className} onClick={() => capture(event, properties)}>
      {children}
    </Link>
  );
}
