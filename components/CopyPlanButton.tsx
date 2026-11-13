"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { monthLabel, shiftMonth } from "@/lib/months";
import { useT } from "./LanguageProvider";
import { localeFor } from "@/lib/i18n";

export default function CopyPlanButton({ monthKey }: { monthKey: string }) {
  const router = useRouter();
  const { t, lang } = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previousKey = shiftMonth(monthKey, -1);
  const previousLabel = monthLabel(previousKey, localeFor(lang));

  async function copyPlan() {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error: fetchError } = await supabase
      .from("planned_payments")
      .select("name, amount, due_date, category_id")
      .eq("month", `${previousKey}-01`);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError(t("plan.copyEmpty", { month: previousLabel }));
      setLoading(false);
      return;
    }

    const [year, month] = monthKey.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();

    const rows = data.map((item) => ({
      month: `${monthKey}-01`,
      name: item.name,
      amount: item.amount,
      category_id: item.category_id,
      due_date: item.due_date
        ? `${monthKey}-${String(
            Math.min(Number(item.due_date.slice(8, 10)), lastDay)
          ).padStart(2, "0")}`
        : null,
    }));

    const { error: insertError } = await supabase
      .from("planned_payments")
      .insert(rows);

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.refresh();
  }

  return (
    <section className="space-y-3 rounded-xl border border-line bg-card p-6">
      <div>
        <h2 className="font-medium">{t("plan.repeatTitle")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("plan.repeatText", { month: previousLabel })}
        </p>
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}

      <button
        type="button"
        onClick={copyPlan}
        disabled={loading}
        className="w-full rounded-lg border border-line py-2 text-sm text-foreground transition-colors hover:bg-hover disabled:opacity-50 sm:w-auto sm:px-6"
      >
        {loading ? t("plan.copying") : t("plan.copyButton", { month: previousLabel })}
      </button>
    </section>
  );
}