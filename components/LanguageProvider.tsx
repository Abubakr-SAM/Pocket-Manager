"use client";

import { createContext, useContext, useMemo } from "react";
import {
  DEFAULT_LANGUAGE,
  localeFor,
  translate,
  type Language,
  type TranslationKey,
} from "@/lib/i18n";

type Vars = Record<string, string | number>;

type LanguageContextValue = {
  lang: Language;
  locale: string;
  t: (key: TranslationKey, vars?: Vars) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANGUAGE,
  locale: localeFor(DEFAULT_LANGUAGE),
  t: (key, vars) => translate(DEFAULT_LANGUAGE, key, vars),
});

export function LanguageProvider({
  lang,
  children,
}: {
  lang: Language;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      lang,
      locale: localeFor(lang),
      t: (key: TranslationKey, vars?: Vars) => translate(lang, key, vars),
    }),
    [lang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// const { t, locale } = useT();
export function useT() {
  return useContext(LanguageContext);
}