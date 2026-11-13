"use client";
import { useT } from "./LanguageProvider";
import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, readTheme, storeTheme, type Theme } from "@/lib/theme";
import type { TranslationKey } from "@/lib/i18n";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
  const options: { value: Theme; labelKey: TranslationKey }[] = [
    { value: "light", labelKey: "theme.light" },
    { value: "dark", labelKey: "theme.dark" },
    { value: "system", labelKey: "theme.system" },
  ];

export default function ThemeForm() {
    const { t } = useT();
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    () => "dark" as Theme
  );

  // "System" tanlangan bo'lsa, qurilma sozlamasi o'zgarganda ham yangilanadi
  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);

  function choose(next: Theme) {
    storeTheme(next);
    applyTheme(next);
    listeners.forEach((listener) => listener());
  }

  return (
    <section className="space-y-4 rounded-xl border border-line bg-card p-6">
      <h2 className="font-medium">{t("theme.title")}</h2>

      <div role="group" aria-label={t("theme.group")} className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            aria-pressed={theme === option.value}
            className={`rounded-lg border py-2 text-sm transition-colors ${
              theme === option.value
                ? "border-foreground bg-foreground text-background"
                : "border-line text-muted hover:bg-hover"
            }`}
          >
            {t(option.labelKey)}    
          </button>
        ))}
      </div>

      <p className="text-xs text-muted">
        {t("theme.note")}
      </p>
    </section>
  );
}