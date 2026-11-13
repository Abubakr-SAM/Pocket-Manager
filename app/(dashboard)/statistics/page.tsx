import StatisticsView, { type StatRow } from "@/components/StatisticsView";
import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function StatisticsPage() {
  const supabase = await createClient();
  const t = await getT();

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, date, categories(name)")
    .neq("type", "saving");

  if (error) {
    console.error("Statistics error:", error.message);
  }

  const transactions = (data ?? []) as unknown as StatRow[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("nav.statistics")}</h1>
        <p className="text-muted">{t("stats.subtitle")}</p>
      </header>

      <StatisticsView transactions={transactions} />
    </div>
  );
}