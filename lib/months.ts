// Oy "2026-11" ko'rinishida saqlanadi
import { monthYear } from "./i18n/dates";
export function currentMonthKey() {
  return new Date().toLocaleDateString("en-CA").slice(0, 7);
}

export function isValidMonth(value: string | undefined): value is string {
  return !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string, locale = "en-US") {
  const [year, month] = key.split("-").map(Number);

  return monthYear(new Date(year, month - 1, 1), locale);
}