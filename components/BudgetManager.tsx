"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/format";
import ConfirmDialog from "./ConfirmDialog";

export type BudgetRow = {
  id: string;
  category_id: string;
  name: string;
  limit: number;
  spent: number;
};

export type BudgetCategory = { id: string; name: string };

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted";

function statusColors(percent: number) {
  if (percent >= 100) return { bar: "bg-expense", text: "text-expense" };
  if (percent >= 80) return { bar: "bg-amber-400", text: "text-amber-400" };
  return { bar: "bg-foreground", text: "text-muted" };
}

export default function BudgetManager({
  budgets,
  categories,
}: {
  budgets: BudgetRow[];
  categories: BudgetCategory[];
}) {
  const router = useRouter();

  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<BudgetRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const available = categories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id)
  );

  const sorted = [...budgets].sort(
    (a, b) => b.spent / b.limit - a.spent / a.limit
  );

  async function addBudget(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);

    const limit = Number(newLimit);
    if (!newCategory) {
      setAddError("Choose a category.");
      return;
    }
    if (!limit || limit <= 0) {
      setAddError("Limit must be greater than 0.");
      return;
    }

    setAdding(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("budgets")
      .insert({ category_id: newCategory, monthly_limit: limit });
    setAdding(false);

    if (error) {
      setAddError(
        error.code === "23505"
          ? "This category already has a budget."
          : error.message
      );
      return;
    }

    setNewCategory("");
    setNewLimit("");
    router.refresh();
  }

  function startEdit(budget: BudgetRow) {
    setEditingId(budget.id);
    setEditLimit(String(budget.limit));
    setEditError(null);
  }

  async function saveEdit() {
    if (!editingId) return;

    const limit = Number(editLimit);
    if (!limit || limit <= 0) {
      setEditError("Limit must be greater than 0.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("budgets")
      .update({ monthly_limit: limit })
      .eq("id", editingId);
    setSaving(false);

    if (error) {
      setEditError(error.message);
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    setListError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("budgets")
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

  return (
    <div className="space-y-8">
      <form
        onSubmit={addBudget}
        className="space-y-4 rounded-xl border border-line bg-card p-6"
      >
        <h2 className="font-medium">Set a monthly budget</h2>

        {available.length === 0 ? (
          <p className="text-sm text-muted">
            {categories.length === 0
              ? "You have no expense categories yet. Create one on the Categories page."
              : "Every expense category already has a budget."}
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="budget-category" className="text-sm text-muted">
                  Category
                </label>
                <select
                  id="budget-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="budget-limit" className="text-sm text-muted">
                  Monthly limit
                </label>
                <input
                  id="budget-limit"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {addError && <p className="text-sm text-expense">{addError}</p>}

            <button
              type="submit"
              disabled={adding}
              className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50 sm:w-auto sm:px-6"
            >
              {adding ? "Saving..." : "Set budget"}
            </button>
          </>
        )}
      </form>

      {listError && <p className="text-sm text-expense">{listError}</p>}

      {budgets.length === 0 ? (
        <p className="text-sm text-muted">
          No budgets yet. Set your first limit above.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sorted.map((b) => {
            const percent = (b.spent / b.limit) * 100;
            const colors = statusColors(percent);
            const left = b.limit - b.spent;

            return (
              <li
                key={b.id}
                className="space-y-4 rounded-xl border border-line bg-card p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate font-medium">{b.name}</h3>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      aria-label={`Change limit for ${b.name}`}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-foreground"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(b)}
                      aria-label={`Remove budget for ${b.name}`}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {editingId === b.id && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        autoFocus
                        aria-label="New monthly limit"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        aria-label="Save limit"
                        className="rounded-lg p-2 text-income transition-colors hover:bg-hover disabled:opacity-50"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancel editing"
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-hover"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {editError && (
                      <p className="text-sm text-expense">{editError}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span>
                      <span className="text-lg font-semibold">
                        {formatMoney(b.spent)}
                      </span>{" "}
                      <span className="text-muted">
                        of {formatMoney(b.limit)}
                      </span>
                    </span>
                    <span className={colors.text}>{Math.round(percent)}%</span>
                  </div>

                  <div
                    role="progressbar"
                    aria-label={`${b.name} budget used`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(100, Math.round(percent))}
                    className="h-2 w-full overflow-hidden rounded-full bg-hover"
                  >
                    <div
                      className={`h-full rounded-full transition-all ${colors.bar}`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  <p className={`text-xs ${colors.text}`}>
                    {left >= 0
                      ? `${formatMoney(left)} left this month`
                      : `Over budget by ${formatMoney(-left)}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove budget?"
        message={`The budget for "${pendingDelete?.name}" will be removed. Your category and transactions stay unchanged.`}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}