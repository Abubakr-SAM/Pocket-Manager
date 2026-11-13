"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/currency";
import { currencySymbol } from "@/lib/format";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { saveLanguage } from "@/lib/i18n/client";
import { useT } from "./LanguageProvider";

// Til tanlanganda mos valyutani taklif qilamiz
const SUGGESTED: Record<Language, string> = {
  en: "USD",
  uz: "UZS",
  ru: "RUB",
};

export default function WelcomeForm({
  userId,
  fullName,
}: {
  userId: string;
  fullName: string;
}) {
  const router = useRouter();
  const { t, lang } = useT();

  const [currency, setCurrency] = useState<string>(SUGGESTED[lang]);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = fullName.split(" ")[0] || t("dashboard.fallbackName");

  function chooseLanguage(next: Language) {
    saveLanguage(next);

    // Foydalanuvchi valyutani o'zi tanlamagan bo'lsa, tilga mosini taklif qilamiz
    if (!touched) setCurrency(SUGGESTED[next]);

    router.refresh();
  }

  async function handleStart() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ currency, onboarded: true })
      .eq("id", userId);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6 rounded-xl border border-line bg-card p-6 sm:p-8">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-background">
          PM
        </div>
        <h1 className="text-xl font-semibold">{t("welcome.title")}</h1>
        <p className="text-sm text-muted">
          {t("welcome.greeting", { name: firstName })}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{t("welcome.languageTitle")}</h2>
        <div role="group" className="grid grid-cols-3 gap-2">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => chooseLanguage(language.code)}
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
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">{t("welcome.currencyTitle")}</h2>
          <p className="mt-1 text-xs text-muted">{t("welcome.currencyHint")}</p>
        </div>

        <div role="group" className="grid gap-2 sm:grid-cols-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code);
                setTouched(true);
              }}
              aria-pressed={currency === c.code}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                currency === c.code
                  ? "border-foreground bg-hover"
                  : "border-line hover:bg-hover"
              }`}
            >
              <span className="min-w-0">
                <span className="font-medium">{c.code}</span>{" "}
                <span className="text-muted">{c.name}</span>
              </span>
                 <span className="shrink-0 text-sm text-muted">
                    {c.code === "UZS" ? "So'm" : currencySymbol(c.code)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-expense">{error}</p>}

      <button
        type="button"
        onClick={handleStart}
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background transition-opacity disabled:opacity-50"
      >
        {loading ? t("common.saving") : t("welcome.start")}
      </button>
    </div>
  );
}