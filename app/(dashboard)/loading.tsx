"use client";

import { useT } from "@/components/LanguageProvider";

export default function Loading() {
  const { t } = useT();

  return (
    <div className="space-y-6" aria-busy="true" aria-label={t("error.loading")}>
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-hover" />
        <div className="h-4 w-48 animate-pulse rounded bg-hover" />
      </div>

      <div className="h-36 animate-pulse rounded-xl border border-line bg-card" />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-line bg-card"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl border border-line bg-card" />
        <div className="h-72 animate-pulse rounded-xl border border-line bg-card" />
      </div>
    </div>
  );
}