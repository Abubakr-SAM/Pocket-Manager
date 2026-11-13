import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CopyPlanButton from "@/components/CopyPlanButton";
import PlanManager, {
  type PlanCategory,
  type PlanItem,
} from "@/components/PlanManager";
import { createClient } from "@/lib/supabase/server";
import { getLanguage, getT } from "@/lib/i18n/server";
import { localeFor } from "@/lib/i18n";
import {
  currentMonthKey,
  isValidMonth,
  monthLabel,
  shiftMonth,
} from "@/lib/months";

type PlanQueryRow = {
  id: string;
  name: string;
  amount: number;
  due_date: string | null;
  category_id: string | null;
  transaction_id: string | null;
  categories: { name: string } | null;
};

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const thisMonth = currentMonthKey();
  const monthKey = isValidMonth(month) ? month : thisMonth;

  const supabase = await createClient();
  const t = await getT();
  const lang = await getLanguage();

  const [itemsRes, categoriesRes] = await Promise.all([
    supabase
      .from("planned_payments")
      .select(
        "id, name, amount, due_date, category_id, transaction_id, categories(name)"
      )
      .eq("month", `${monthKey}-01`)
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name")
      .eq("type", "expense")
      .order("name"),
  ]);

  if (itemsRes.error) {
    console.error("Plan error:", itemsRes.error.message);
  }
  if (categoriesRes.error) {
    console.error("Categories error:", categoriesRes.error.message);
  }

  const items: PlanItem[] = (
    (itemsRes.data ?? []) as unknown as PlanQueryRow[]
  ).map((row) => ({
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    due_date: row.due_date,
    category_id: row.category_id,
    category_name: row.categories?.name ?? null,
    transaction_id: row.transaction_id,
  }));

  const categories = (categoriesRes.data ?? []) as PlanCategory[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("plan.title")}</h1>
        <p className="text-muted">
          {t("plan.subtitle")}
        </p>
      </header>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3">
        <Link
          href={`/plan?month=${shiftMonth(monthKey, -1)}`}
          aria-label={t("plan.prevMonth")}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-foreground"
        >
          <ChevronLeft size={18} />
        </Link>

        <div className="text-center">
          <p className="font-medium">{monthLabel(monthKey, localeFor(lang))}</p>
          {monthKey !== thisMonth && (
            <Link
              href="/plan"
              className="text-xs text-muted hover:text-foreground hover:underline"
            >
              {t("plan.backToThisMonth")}
            </Link>
          )}
        </div>

        <Link
          href={`/plan?month=${shiftMonth(monthKey, 1)}`}
          aria-label={t("plan.nextMonth")}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-foreground"
        >
          <ChevronRight size={18} />
        </Link>
      </div>

      {items.length === 0 && <CopyPlanButton monthKey={monthKey} />}

      <PlanManager
        key={monthKey}
        monthKey={monthKey}
        items={items}
        categories={categories}
      />
    </div>
  );
}