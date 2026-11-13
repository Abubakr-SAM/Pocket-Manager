import { DEFAULT_CURRENCY } from "./currency";
import { dayMonth } from "./i18n/dates";

// Pulni tanlangan valyutada ko'rsatadi: 1250 -> $1,250.00 yoki 1 250 so'm
export function formatMoney(value: number, currency: string = DEFAULT_CURRENCY) {
  if (currency === "UZS") {
    const number = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace(/,/g, " ");

    return `${number} so'm`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(value);
}

// Valyuta belgisi (so'm uchun bo'sh, chunki u raqamdan keyin yoziladi)
export function currencySymbol(currency: string) {
  if (currency === "UZS") return "";

  const part = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((p) => p.type === "currency");

  return part?.value ?? "";
}

// Grafik o'qlari uchun ixcham ko'rinish: 1500 -> $1.5K
export function formatCompact(
  value: number,
  currency: string = DEFAULT_CURRENCY
) {
  const number = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  return `${currencySymbol(currency)}${number}`;
}

// Sana tilga qarab chiqadi: "Oct 28" yoki "28-okt"
export function formatDate(value: string, locale = "en-US") {
  return dayMonth(new Date(value), locale);
}