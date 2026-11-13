import type { Translate, TranslationKey } from "./index";

// Standart (tizim yaratgan) kategoriyalar: bazadagi nom -> tarjima kaliti
const DEFAULT_KEYS = new Map<string, TranslationKey>([
  ["Salary", "category.salary"],
  ["Allowance", "category.allowance"],
  ["Freelance", "category.freelance"],
  ["Gift", "category.gift"],
  ["Other", "category.other"],
  ["Food", "category.food"],
  ["Transport", "category.transport"],
  ["Education", "category.education"],
  ["Shopping", "category.shopping"],
  ["Entertainment", "category.entertainment"],
  ["Health", "category.health"],
  ["Bills", "category.bills"],
]);

// Standart kategoriya bo'lsa tarjimasini, o'zingiz qo'shgan bo'lsa nomini o'zini qaytaradi
export function categoryLabel(name: string, t: Translate) {
  const key = DEFAULT_KEYS.get(name);
  return key ? t(key) : name;
}