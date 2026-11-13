import GoalForm, { type Goal } from "@/components/GoalForm";
import GoalList from "@/components/GoalList";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export default async function GoalsPage() {
  const supabase = await createClient();
  const t = await getT();

  const { data, error } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, current_amount, deadline, description")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Goals error:", error.message);
  }

  const goals = (data ?? []) as Goal[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("nav.goals")}</h1>
        <p className="text-muted">{t("goals.subtitle")}</p>
      </header>

      <GoalForm />

      <GoalList goals={goals} />
    </div>
  );
}