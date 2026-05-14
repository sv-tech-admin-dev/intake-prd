"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const defaultIntervalMs = 5000;

export function DocumentRefreshPoller({ active, intervalMs = defaultIntervalMs }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();

  React.useEffect(() => {
    if (!active) return;

    let cancelled = false;
    const refresh = () => {
      if (!cancelled) {
        router.refresh();
      }
    };

    const timer = window.setInterval(refresh, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active, intervalMs, router]);

  if (!active) {
    return null;
  }

  return (
    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
      Auto-refreshing until generation is ready
    </p>
  );
}
