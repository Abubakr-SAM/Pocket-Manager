import { getT } from "@/lib/i18n/server";
import { SITE } from "@/lib/site";

export default async function SiteFooter() {
  const t = await getT();

  return (
    <footer className="mt-12 border-t border-line pt-6 text-center text-xs text-muted">
      <p>
        {SITE.name} · {t("about.builtBy")}{" "}
        <span className="text-foreground">{SITE.author}</span>
      </p>
      <p className="mt-1">© {new Date().getFullYear()}</p>
    </footer>
  );
}