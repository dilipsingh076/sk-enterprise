"use client";

import { useEffect, useState } from "react";
import { Banner } from "@/components/ui";
import type { StorageHealth } from "@/lib/storage/storageHealth";

export function StorageStatusBanner() {
  const [health, setHealth] = useState<StorageHealth | null>(null);

  useEffect(() => {
    void fetch("/api/storage/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((h) => setHealth(h as StorageHealth))
      .catch(() => setHealth(null));
  }, []);

  if (!health || health.ok) return null;

  return (
    <Banner tone="warning" role="status" className="rounded-none border-x-0 border-t-0">
      {health.message}
    </Banner>
  );
}
