import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

type GoalPreview = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
};

export default async function GoalsPreview({
  goals,
  currency,
}: {
  goals: GoalPreview[];
  currency: string;
}): Promise<import("react").JSX.Element> {
    const t = await getT();
    const items = goals
    .map((g) => {
      const target = Number(g.target_amount);
      const current = Number(g.current_amount);

      return {
        id: g.id,
        name: g.name,
        target,
        current,
        percent: Math.min(100, (current / target) * 100),
        completed: current >= target,
      };
    })
    .sort(
      (a, b) => Number(a.completed) - Number(b.completed) || b.percent - a.percent
    )
    .slice(0, 3);

  return (
    <div className="rounded-xl border border-line bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t("goalsPreview.title")}</h2>
        <Link
          href="/goals"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          {t("common.viewAll")}
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          {t("goalsPreview.empty")}{" "}
          <Link href="/goals" className="text-foreground hover:underline">
            {t("goalsPreview.create")}
          </Link>
        </p>
      ) : (
        <ul className="mt-4 grid gap-6 md:grid-cols-3">
          {items.map((g) => (
            <li key={g.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">{g.name}</span>
                <span className="shrink-0 text-muted">
                  {Math.round(g.percent)}%
                </span>
              </div>

              <div
                role="progressbar"
                aria-label={t("goalsPreview.progressAria", { name: g.name })}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(g.percent)}
                className="h-2 w-full overflow-hidden rounded-full bg-hover"
              >
                <div
                  className={`h-full rounded-full ${
                    g.completed ? "bg-income" : "bg-foreground"
                  }`}
                  style={{ width: `${g.percent}%` }}
                />
              </div>

              <p className="text-xs text-muted">
                {t("goalsPreview.progress", { current: formatMoney(g.current, currency), 
                target: formatMoney(g.target, currency) })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}