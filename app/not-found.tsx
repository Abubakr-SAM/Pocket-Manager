import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-5xl font-semibold">404</p>
      <h1 className="text-lg font-medium">{t("error.notFoundTitle")}</h1>
      <p className="max-w-sm text-sm text-muted">{t("error.notFoundText")}</p>
      <Link
        href="/"
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        {t("error.backToDashboard")}
      </Link>
    </div>
  );
}