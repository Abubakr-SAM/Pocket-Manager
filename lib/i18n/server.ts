import { cookies } from "next/headers";
import {
  LANGUAGE_COOKIE,
  normalizeLanguage,
  translate,
  type Language,
  type TranslationKey,
} from "./index";

export async function getLanguage(): Promise<Language> {
  const store = await cookies();
  return normalizeLanguage(store.get(LANGUAGE_COOKIE)?.value);
}

// const t = await getT();  t("nav.dashboard")
export async function getT() {
  const lang = await getLanguage();

  return (key: TranslationKey, vars?: Record<string, string | number>) =>
    translate(lang, key, vars);
}