import { SITE } from "@/lib/site";
import { getT } from "@/lib/i18n/server";
import Logo from "@/components/Logo";

export default async function AboutCard() {
  const t = await getT();

  return (
    <section className="space-y-5 rounded-xl border border-line bg-card p-6">
      <div className="flex items-center gap-3">
        <Logo size={40} className="shrink-0" />
        <div>
          <h2 className="font-medium">{SITE.name}</h2>
          <p className="text-sm text-muted">{t("about.tagline")}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        {t("about.description")}
      </p>

      <div className="border-t border-line pt-4">
        <p className="text-xs uppercase tracking-wide text-muted">
          {t("about.builtBy")}
        </p>
        <p className="mt-1 font-medium">{SITE.author}</p>
      </div>
    </section>
  );
}