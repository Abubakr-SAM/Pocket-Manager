"use client";

import { useRouter } from "next/navigation";
  import { LANGUAGES, type Language } from "@/lib/i18n";
  import { saveLanguage } from "@/lib/i18n/client";
import { useT } from "./LanguageProvider";

export default function LanguageSwitcher() {
  const router = useRouter();
  const { lang } = useT();

  function choose(next: Language) {
    saveLanguage(next);
    router.refresh();
  }

  return (
    <div role="group" aria-label="Language" className="flex gap-1">
      {LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          onClick={() => choose(language.code)}
          aria-pressed={lang === language.code}
          title={language.name}
          className={`rounded-md border px-2.5 py-1 text-xs uppercase transition-colors ${
            lang === language.code
              ? "border-foreground bg-foreground text-background"
              : "border-line text-muted hover:bg-hover"
          }`}
        >
          {language.code}
        </button>
      ))}
    </div>
  );
}