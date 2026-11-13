import type { Translate } from "./index";

// Supabase xabarlari inglizcha keladi: tanish bo'lganlarini tilga o'giramiz
export function authError(message: string, t: Translate) {
  const text = message.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return t("auth.invalidCredentials");
  }
  if (text.includes("already registered")) {
    return t("auth.alreadyRegistered");
  }
  if (text.includes("at least 6 characters")) {
    return t("auth.passwordShort");
  }

  return message;
}