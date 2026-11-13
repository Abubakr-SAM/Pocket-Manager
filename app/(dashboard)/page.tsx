import Link from "next/link";
import { getLanguage, getT } from "@/lib/i18n/server";
import { localeFor } from "@/lib/i18n";
import {
  CalendarDays,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import GoalsPreview from "@/components/GoalsPreview";
import SpendingOverview from "@/components/SpendingOverview";
import StatCard from "@/components/StatCard";
import { createClient } from "@/lib/supabase/server";
import { getCurrency } from "@/lib/get-currency";
import { formatMoney } from "@/lib/format";


type TransactionRow = {
  id: string;
  type: "income" | "expense" | "saving";
  amount: number;
  description: string | null;
  date: string;
  categories: { name: string } | null;
  savings_goals: { name: string } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const currency = await getCurrency();
  const tr = await getT();
  const locale = localeFor(await getLanguage());
  const money = (value: number) => formatMoney(value, currency);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName: string = user?.user_metadata?.full_name ?? "";
  const firstName = fullName.split(" ")[0] || tr("dashboard.fallbackName")

  const [transactionsRes, goalsRes] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, type, amount, description, date, categories(name), savings_goals(name)"
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("savings_goals")
      .select("id, name, target_amount, current_amount"),
  ]);

  if (transactionsRes.error) {
    console.error("Transactions error:", transactionsRes.error.message);
  }
  if (goalsRes.error) {
    console.error("Goals error:", goalsRes.error.message);
  }

  const transactions = (transactionsRes.data ??
    []) as unknown as TransactionRow[];
  const goals = goalsRes.data ?? [];

  const sum = (rows: TransactionRow[]) =>
    rows.reduce((total, t) => total + Number(t.amount), 0);

  const expenses = transactions.filter((t) => t.type === "expense");

  const totalIncome = sum(transactions.filter((t) => t.type === "income"));
  const totalExpenses = sum(expenses);
  const movedToSavings = sum(transactions.filter((t) => t.type === "saving"));
  const balance = totalIncome - totalExpenses - movedToSavings;

  const spentPercent =
    totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;

  // Shu oydagi xarajat va o'tgan oyning o'sha kunlari bilan solishtirish
  const now = new Date();
  const currentMonth = now.toLocaleDateString("en-CA").slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toLocaleDateString("en-CA")
    .slice(0, 7);
  const today = now.getDate();

  const monthSpent = sum(expenses.filter((t) => t.date.startsWith(currentMonth)));
  const lastMonthSpent = sum(
    expenses.filter(
      (t) =>
        t.date.startsWith(lastMonth) && Number(t.date.slice(8, 10)) <= today
    )
  );

  let monthNote = tr("dashboard.noLastMonth");
  let monthNoteClass = "text-muted";

  if (lastMonthSpent > 0) {
    const change = Math.round(
      ((monthSpent - lastMonthSpent) / lastMonthSpent) * 100
    );

    monthNote =
      change === 0
        ? tr("dashboard.sameAsLastMonth")
        :tr("dashboard.vsLastMonth", { change: `${change > 0 ? "+" : ""}${change}` });
    monthNoteClass =
      change > 0 ? "text-expense" : change < 0 ? "text-income" : "text-muted";
  }

  const totalSaved = goals.reduce(
    (total, g) => total + Number(g.current_amount),
    0
  );

  const recent = transactions.slice(0, 5);

  const expenseRows = expenses.map((t) => ({
    date: t.date,
    amount: Number(t.amount),
  }));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{tr("dashboard.welcome", { name: firstName })}</h1>
          <p className="text-muted">{tr("dashboard.subtitle")}</p>
        </div>

        <Link
          href="/transactions"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          {tr("common.add")}
        </Link>
      </header>

      <section className="rounded-xl border border-line bg-card p-6">
        <p className="text-sm text-muted">{tr("dashboard.balance")}</p>
        <p
          className={`mt-2 text-4xl font-semibold tracking-tight ${
            balance < 0 ? "text-expense" : ""
          }`}
        >
          {money(balance)}
        </p>

        {movedToSavings > 0 && (
          <p className="mt-1 text-xs text-muted">
            {tr("dashboard.afterSavings", { amount: money(movedToSavings) })}
          </p>
        )}

        {totalIncome > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between gap-2 text-xs text-muted">
              <span>{tr("dashboard.incomeSpent", { percent: spentPercent })}</span>
              <span>
                {tr("dashboard.spentOfIncome", { spent: money(totalExpenses), income: money(totalIncome) })}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={tr("dashboard.incomeSpentAria")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, spentPercent)}
              className="h-2 w-full overflow-hidden rounded-full bg-hover"
            >
              <div
                className={`h-full rounded-full ${
                  spentPercent >= 100 ? "bg-expense" : "bg-foreground"
                }`}
                style={{ width: `${Math.min(100, spentPercent)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          title={tr("dashboard.income")}
          amount={money(totalIncome)}
          amountClassName="text-income"
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          title={tr("dashboard.expenses")}
          amount={money(totalExpenses)}
          amountClassName="text-expense"
          icon={<TrendingDown size={16} />}
        />
        <StatCard
          title={tr("dashboard.spentThisMonth")}
          amount={money(monthSpent)}
          icon={<CalendarDays size={16} />}
          note={monthNote}
          noteClassName={monthNoteClass}
        />
        <StatCard
          title={tr("dashboard.savings")}
          amount={money(totalSaved)}
          icon={<PiggyBank size={16} />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-card p-6">
          <SpendingOverview expenses={expenseRows} />
        </div>

        <div className="rounded-xl border border-line bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{tr("dashboard.recent")}</h2>
            <Link
              href="/transactions"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {tr("common.viewAll")}
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{tr("dashboard.noTransactions")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recent.map((t) => {
                const isSaving = t.type === "saving";

                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate">
                        {isSaving
                          ? tr("dashboard.savedTo", { goal: t.savings_goals?.name ?? tr("dashboard.goalFallback") })
                          : t.description || t.categories?.name || tr("dashboard.transactionFallback")}
                      </p>
                      <p className="text-muted">
                        {isSaving
                          ? tr("dashboard.savingsGoalLabel")
                          : (t.categories ? t.categories.name : tr("common.uncategorized"))}{" "}
                        · {new Date(`${t.date}T00:00:00`).toLocaleDateString(locale)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 ${
                        t.type === "income"
                          ? "text-income"
                          : t.type === "expense"
                            ? "text-expense"
                            : ""
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {money(Number(t.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <GoalsPreview goals={goals} currency={currency} />
    </div>
  );
}