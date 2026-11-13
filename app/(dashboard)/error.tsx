"use client";

import { useEffect } from "react";
import { useT } from "@/components/LanguageProvider";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-lg font-medium">{t("error.title")}</h1>
      <p className="text-sm text-muted">{t("error.text")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        {t("error.tryAgain")}
      </button>
    </div>
  );
}