export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "UZS", name: "Uzbekistan So'm" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "KZT", name: "Kazakhstan Tenge" },
  { code: "KRW", name: "South Korean Won" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "CNY", name: "Chinese Yuan" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function normalizeCurrency(
  value: string | null | undefined
): CurrencyCode {
  return CURRENCIES.find((c) => c.code === value)?.code ?? DEFAULT_CURRENCY;
}