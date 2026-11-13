"use client";

import { useMemo, useState } from "react";
import { SpendingChart } from "./charts";
import { useT } from "./LanguageProvider";
import {
  type Period,
  bucketKey,
  buildBuckets,
  chartInterval,
  periods,
  round,
} from "@/lib/periods";

type ExpenseRow = { date: string; amount: number };

export default function SpendingOverview({
  expenses,
}: {
  expenses: ExpenseRow[];
}) {
  const { t, locale } = useT();
  const [period, setPeriod] = useState<Period>("week");

  const { data, total } = useMemo(() => {
    const buckets = buildBuckets(period, locale);
    const byKey = new Map<string, number>(buckets.map((b) => [b.key, 0]));

    for (const e of expenses) {
      const key = bucketKey(period, e.date);
      if (byKey.has(key)) {
        byKey.set(key, (byKey.get(key) ?? 0) + Number(e.amount));
      }
    }

    return {
      data: buckets.map((b) => ({
        label: b.label,
        amount: round(byKey.get(b.key) ?? 0),
      })),
      total: [...byKey.values()].reduce((sum, v) => sum + v, 0),
    };
  }, [expenses, period, locale]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">{t("spending.title")}</h2>

        <div className="flex gap-1">
          {periods.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                period === p.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-line text-muted hover:bg-hover"
              }`}
            >
              {t(p.shortKey)}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("spending.empty")}</p>
      ) : (
        <div className="mt-4">
          <SpendingChart data={data} interval={chartInterval(period)} />
        </div>
      )}
    </div>
  );
}