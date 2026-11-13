import { en, type TranslationKey } from "./en";
import { ru } from "./ru";
import { uz } from "./uz";

export type { TranslationKey };
export type Translate = (
  key: TranslationKey,
  vars?: Record<string, string | number>
) => string;

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "uz", name: "O'zbekcha" },
  { code: "ru", name: "Русский" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_COOKIE = "lang";

const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en,
  uz,
  ru,
};

export function normalizeLanguage(value: string | null | undefined): Language {
  return LANGUAGES.find((l) => l.code === value)?.code ?? DEFAULT_LANGUAGE;
}

// translate("uz", "nav.goals") yoki o'zgaruvchi bilan: translate("en", "hello", { name: "Ali" })
export function translate(
  lang: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>
) {
  let text: string = dictionaries[lang][key] ?? en[key];

  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }

  return text;
}
const LOCALES: Record<Language, string> = {
  en: "en-US",
  uz: "uz-UZ",
  ru: "ru-RU",
};

export function localeFor(lang: Language) {
  return LOCALES[lang];
}