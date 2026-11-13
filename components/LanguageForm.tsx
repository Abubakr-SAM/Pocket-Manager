"use client";

import { useRouter } from "next/navigation";
  import { LANGUAGES, type Language } from "@/lib/i18n";
  import { saveLanguage } from "@/lib/i18n/client";
import { useT } from "./LanguageProvider";

export default function LanguageForm() {
  const router = useRouter();
  const { lang, t } = useT();

  function choose(next: Language) {
    saveLanguage(next);
    router.refresh();
  }

  return (
    <section className="space-y-4 rounded-xl border border-line bg-card p-6">
      <h2 className="font-medium">{t("language.title")}</h2>

      <div
        role="group"
        aria-label={t("language.title")}
        className="grid grid-cols-3 gap-2"
      >
        {LANGUAGES.map((language) => (
          <button
            key={language.code}
            type="button"
            onClick={() => choose(language.code)}
            aria-pressed={lang === language.code}
            className={`rounded-lg border py-2 text-sm transition-colors ${
              lang === language.code
                ? "border-foreground bg-foreground text-background"
                : "border-line text-muted hover:bg-hover"
            }`}
          >
            {language.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted">{t("language.note")}</p>
    </section>
  );
}