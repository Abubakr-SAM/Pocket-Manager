import { LANGUAGE_COOKIE, type Language } from "./index";

// Tanlangan tilni brauzerda 1 yilga eslab qoladi
export function saveLanguage(lang: Language) {
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}