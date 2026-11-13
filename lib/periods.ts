import type { TranslationKey } from "@/lib/i18n";
import { monthShort, weekdayShort } from "@/lib/i18n/dates";

export type Period = "week" | "month" | "year";

export const periods: {
  value: Period;
  label: string;
  short: string;
  labelKey: TranslationKey;
  shortKey: TranslationKey;
}[] = [
  {
    value: "week",
    label: "Last 7 days",
    short: "Week",
    labelKey: "period.week",
    shortKey: "period.weekShort",
  },
  {
    value: "month",
    label: "This month",
    short: "Month",
    labelKey: "period.month",
    shortKey: "period.monthShort",
  },
  {
    value: "year",
    label: "This year",
    short: "Year",
    labelKey: "period.year",
    shortKey: "period.yearShort",
  },
];

export const isoDate = (d: Date) => d.toLocaleDateString("en-CA");
export const round = (n: number) => Math.round(n * 100) / 100;

// Grafikdagi har bir ustun uchun "chelak": kun yoki oy
export function buildBuckets(period: Period, locale = "en-US") {
  const now = new Date();
  const buckets: { key: string; label: string }[] = [];

  if (period === "year") {
    for (let m = 0; m < 12; m++) {
      buckets.push({
        key: `${now.getFullYear()}-${String(m + 1).padStart(2, "0")}`,
        label: monthShort(new Date(now.getFullYear(), m, 1), locale),
      });
    }
    return buckets;
  }

  const start =
    period === "week"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      : new Date(now.getFullYear(), now.getMonth(), 1);
  const end =
    period === "week"
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    buckets.push({
      key: isoDate(d),
      label: period === "week" ? weekdayShort(d, locale) : String(d.getDate()),
    });
  }

  return buckets;
}

// Tranzaksiya sanasi qaysi chelakka tushishini aniqlaydi
export function bucketKey(period: Period, date: string) {
  return period === "year" ? date.slice(0, 7) : date;
}

// Oy grafigida 31 ta yozuv sig'masligi uchun oraliq
export function chartInterval(period: Period) {
  return period === "month" ? 2 : 0;
}