"use client";
import { useT } from "./LanguageProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import { useCurrency } from "./CurrencyProvider";
import ConfirmDialog from "./ConfirmDialog";
import GoalForm, { type Goal } from "./GoalForm";
import type { Translate } from "@/lib/i18n";

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted";

function deadlineInfo(deadline: string | null, t: Translate) {
  if (!deadline) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${deadline}T00:00:00`);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days > 1) return { text: t("goals.daysLeft", { count: days }), overdue: false };
  if (days === 1) return { text: t("goals.oneDayLeft"), overdue: false };
  if (days === 0) return { text: t("goals.dueToday"), overdue: false };

  const late = -days;
  return {
    text: late === 1 ? t("goals.overdueOne") : t("goals.overdueMany", { count: late }),
    overdue: true,
  };
}

export default function GoalList({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const { t, locale } = useT();
  const { format } = useCurrency();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  function startAdding(id: string) {
    setAddingId(id);
    setAddAmount("");
    setError(null);
  }

  async function addMoney(goal: Goal) {
    const value = Number(addAmount);

    if (!value || value <= 0) {
      setError(t("transactions.amountError"));
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.from("transactions").insert({
      type: "saving",
      amount: value,
      goal_id: goal.id,
      date: new Date().toLocaleDateString("en-CA"),
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setAddingId(null);
    setAddAmount("");
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    setListError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("savings_goals")
      .delete()
      .eq("id", pendingDelete.id);

    setDeleting(false);
    setPendingDelete(null);

    if (error) {
      setListError(error.message);
      return;
    }

    router.refresh();
  }

  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted">
        {t("goals.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {listError && <p className="text-sm text-expense">{listError}</p>}

      <ul className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          if (editingId === goal.id) {
            return (
              <li key={goal.id} className="md:col-span-2">
                <GoalForm goal={goal} onDone={() => setEditingId(null)} />
              </li>
            );
          }

          const target = Number(goal.target_amount);
          const current = Number(goal.current_amount);
          const completed = current >= target;
          const percent = Math.min(100, (current / target) * 100);
          const remaining = Math.max(0, target - current);
          const deadline = deadlineInfo(goal.deadline, t);

          return (
            <li
              key={goal.id}
              className="space-y-4 rounded-xl border border-line bg-card p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{goal.name}</h3>
                  {goal.description && (
                    <p className="mt-1 text-sm text-muted">
                      {goal.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {completed && (
                    <span className="mr-1 rounded-md border border-income px-2 py-0.5 text-xs text-income">
                      {t("goals.completed")}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setEditingId(goal.id)}
                    aria-label={t("goals.editAria", { name: goal.name })}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-foreground"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPendingDelete(goal)}
                    aria-label={t("goals.deleteAria", { name: goal.name })}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-expense"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-sm">
                  <span>
                    <span className="text-lg font-semibold">
                      {format(current)}
                    </span>{" "}
                    <span className="text-muted">{t("goals.ofTarget", { target: format(target) })}</span>
                  </span>
                  <span className="text-muted">
                    {Math.round(percent * 10) / 10}%
                  </span>
                </div>

                <div
                  role="progressbar"
                  aria-label={t("goalsPreview.progressAria", { name: goal.name })}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(percent)}
                  className="h-2 w-full overflow-hidden rounded-full bg-hover"
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      completed ? "bg-income" : "bg-foreground"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted">
                  <span>
                    {completed
                      ? "Goal reached"
                      : t("goals.toGo", { amount: format(remaining) })}
                  </span>

                  {goal.deadline && deadline && (
                    <span
                      suppressHydrationWarning
                      className={
                        deadline.overdue && !completed ? "text-expense" : ""
                      }
                    >
                      {formatDate(goal.deadline, locale)} ·{" "}
                      {completed ? t("goals.done") : deadline.text}
                    </span>
                  )}
                </div>
              </div>

              {addingId === goal.id ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0.01"
                      autoFocus
                      aria-label={t("goals.amountAria")}
                      placeholder={t("transactions.amount")}
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addMoney(goal);
                        if (e.key === "Escape") setAddingId(null);
                      }}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => addMoney(goal)}
                      disabled={saving}
                      className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50"
                    >
                      {saving ? "..." : t("common.add")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingId(null)}
                      className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:bg-hover"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                  {error && <p className="text-sm text-expense">{error}</p>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startAdding(goal.id)}
                  className="w-full rounded-lg border border-line py-2 text-sm text-muted transition-colors hover:bg-hover hover:text-foreground"
                >
                  {t("goals.addMoney")}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("goals.deleteTitle")}
        message={t("goals.deleteMessage", { name: pendingDelete?.name ?? "" })}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}