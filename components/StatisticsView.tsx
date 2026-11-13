"use client";
import { categoryLabel } from "@/lib/i18n/categories";
import { useMemo, useState } from "react";
import StatCard from "./StatCard";
import ChartTypeSwitch from "./ChartTypeSwitch";
import { useCurrency } from "./CurrencyProvider";
import { useT } from "./LanguageProvider";
import {
  CategoryChart,
  SpendingChart,
  type CategoryVariant,
  type SpendingVariant,
} from "./charts";
import {
  type Period,
  bucketKey,
  buildBuckets,
  chartInterval,
  periods,
  round,
} from "@/lib/periods";

export type StatRow = {
  type: "income" | "expense";
  amount: number;
  date: string;
  categories: { name: string } | null;
};

export default function StatisticsView({
  transactions,
}: {
  transactions: StatRow[];
}) {
  const { format } = useCurrency();
  const { t: tr, locale } = useT();

  const [period, setPeriod] = useState<Period>("month");
  const [spendingVariant, setSpendingVariant] =
    useState<SpendingVariant>("bar");
  const [categoryVariant, setCategoryVariant] =
    useState<CategoryVariant>("bar");

  const spendingOptions: { value: SpendingVariant; label: string }[] = [
    { value: "bar", label: tr("stats.chartBar") },
    { value: "line", label: tr("stats.chartLine") },
    { value: "area", label: tr("stats.chartArea") },
  ];

  const categoryOptions: { value: CategoryVariant; label: string }[] = [
    { value: "bar", label: tr("stats.chartBar") },
    { value: "pie", label: tr("stats.chartPie") },
  ];

  const stats = useMemo(() => {
    const buckets = buildBuckets(period, locale);
    const spendByKey = new Map<string, number>(buckets.map((b) => [b.key, 0]));
    const byCategory = new Map<string, number>();
    let income = 0;
    let expenses = 0;

    for (const t of transactions) {
      const key = bucketKey(period, t.date);
      if (!spendByKey.has(key)) continue;

      const amount = Number(t.amount);

      if (t.type === "income") {
        income += amount;
        continue;
      }

      expenses += amount;
      spendByKey.set(key, (spendByKey.get(key) ?? 0) + amount);

      const name = t.categories ? categoryLabel(t.categories.name, tr) : tr("common.uncategorized");
      byCategory.set(name, (byCategory.get(name) ?? 0) + amount);
    }

    return {
      income,
      expenses,
      spending: buckets.map((b) => ({
        label: b.label,
        amount: round(spendByKey.get(b.key) ?? 0),
      })),
      categories: [...byCategory.entries()]
        .map(([name, value]) => ({ name, value: round(value) }))
        .sort((a, b) => b.value - a.value),
    };
  }, [transactions, period, locale, tr]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-2">
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-lg border py-2 text-sm transition-colors ${
              period === p.value
                ? "border-foreground bg-foreground text-background"
                : "border-line text-muted hover:bg-hover"
            }`}
          >
            {tr(p.labelKey)}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title={tr("dashboard.income")}
          amount={format(stats.income)}
          amountClassName="text-income"
        />
        <StatCard
          title={tr("dashboard.expenses")}
          amount={format(stats.expenses)}
          amountClassName="text-expense"
        />
        <StatCard
          title={tr("stats.net")}
          amount={format(stats.income - stats.expenses)}
        />
      </section>

      <section className="rounded-xl border border-line bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">{tr("stats.overTime")}</h2>
          {stats.expenses > 0 && (
            <ChartTypeSwitch
              label={tr("stats.spendingChartAria")}
              options={spendingOptions}
              value={spendingVariant}
              onChange={setSpendingVariant}
            />
          )}
        </div>

        {stats.expenses === 0 ? (
          <p className="text-sm text-muted">{tr("spending.empty")}</p>
        ) : (
          <SpendingChart
            data={stats.spending}
            interval={chartInterval(period)}
            variant={spendingVariant}
          />
        )}
      </section>

      <section className="rounded-xl border border-line bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">{tr("stats.byCategory")}</h2>
          {stats.categories.length > 0 && (
            <ChartTypeSwitch
              label={tr("stats.categoryChartAria")}
              options={categoryOptions}
              value={categoryVariant}
              onChange={setCategoryVariant}
            />
          )}
        </div>

        {stats.categories.length === 0 ? (
          <p className="text-sm text-muted">{tr("spending.empty")}</p>
        ) : (
          <CategoryChart data={stats.categories} variant={categoryVariant} />
        )}
      </section>
    </div>
  );
}