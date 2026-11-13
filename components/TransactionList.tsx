"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import { categoryLabel } from "@/lib/i18n/categories";
import type { Translate } from "@/lib/i18n";
import ConfirmDialog from "./ConfirmDialog";
import { useCurrency } from "./CurrencyProvider";
import { useT } from "./LanguageProvider";
import TransactionForm, { type Category } from "./TransactionForm";

export type TransactionRow = {
  id: string;
  type: "income" | "expense" | "saving";
  amount: number;
  category_id: string | null;
  description: string | null;
  date: string;
  categories: { name: string } | null;
  savings_goals: { name: string } | null;
};

type TypeFilter = "all" | "income" | "expense" | "saving";

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted";

function rowTitle(t: TransactionRow, tr: Translate): string {
  if (t.type === "saving") {
    return tr("dashboard.savedTo", {
      goal: t.savings_goals?.name ?? tr("dashboard.goalFallback"),
    });
  }

  return (
    t.description ||
    (t.categories && categoryLabel(t.categories.name, tr)) ||
    tr("dashboard.transactionFallback")
  );
}

function rowSubtitle(t: TransactionRow, tr: Translate, locale: string): string {
  const label =
    t.type === "saving"
      ? tr("dashboard.savingsGoalLabel")
      : t.categories
        ? categoryLabel(t.categories.name, tr)
        : tr("common.uncategorized");

  return `${label} · ${formatDate(t.date, locale)}`;
}

export default function TransactionList({
  transactions,
  categories,
}: {
  transactions: TransactionRow[];
  categories: Category[];
}) {
  const router = useRouter();
  const { format } = useCurrency();
  const { t: tr, locale } = useT();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TransactionRow | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filterCategories = categories.filter(
    (c) => typeFilter === "all" || c.type === typeFilter
  );

  const hasFilters =
    search !== "" ||
    typeFilter !== "all" ||
    categoryFilter !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter && t.category_id !== categoryFilter) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;

      if (q) {
        const text = `${t.description ?? ""} ${t.categories?.name ?? ""} ${
          t.categories ? categoryLabel(t.categories.name, tr) : ""
        } ${t.savings_goals?.name ?? ""} ${t.type} ${
          t.type === "saving" ? "savings goal" : ""
        }`;
        if (!text.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [transactions, search, typeFilter, categoryFilter, dateFrom, dateTo, tr]);

  // Faqat ekranda ko'rinib turgan (filtrdan o'tgan) belgilanganlar
  const selectedRows = filtered.filter((t) => selected.has(t.id));
  const allSelected =
    filtered.length > 0 && selectedRows.length === filtered.length;
  const hasSavingSelected = selectedRows.some((t) => t.type === "saving");

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((t) => t.id)));
  }

  function changeTypeFilter(next: TypeFilter) {
    setTypeFilter(next);
    setCategoryFilter("");
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("");
    setDateFrom("");
    setDateTo("");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", pendingDelete.id);

    setDeleting(false);
    setPendingDelete(null);

    if (error) {
      setError(error.message);
      return;
    }

    router.refresh();
  }

  async function confirmBulkDelete() {
    const ids = selectedRows.map((t) => t.id);
    if (ids.length === 0) return;

    setBulkDeleting(true);
    setError(null);

    const supabase = createClient();
    let failure: string | null = null;

    // Ko'p bo'lsa, so'rov juda uzun bo'lib ketmasligi uchun 50 tadan o'chiramiz
    for (let i = 0; i < ids.length; i += 50) {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", ids.slice(i, i + 50));

      if (error) {
        failure = error.message;
        break;
      }
    }

    setBulkDeleting(false);
    setBulkOpen(false);
    setSelected(new Set());

    if (failure) setError(failure);
    router.refresh();
  }

  const deletingSaving = pendingDelete?.type === "saving";

  return (
    <section className="rounded-xl border border-line bg-card p-6">
      <h2 className="font-medium">{tr("transactions.all")}</h2>

      {transactions.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="search"
              placeholder={tr("transactions.searchPlaceholder")}
              aria-label={tr("transactions.searchAria")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} sm:col-span-2 lg:col-span-4`}
            />

            <select
              aria-label={tr("transactions.filterTypeAria")}
              value={typeFilter}
              onChange={(e) => changeTypeFilter(e.target.value as TypeFilter)}
              className={inputClass}
            >
              <option value="all">{tr("transactions.allTypes")}</option>
              <option value="income">{tr("transactions.income")}</option>
              <option value="expense">{tr("transactions.expense")}</option>
              <option value="saving">{tr("transactions.saving")}</option>
            </select>

            <select
              aria-label={tr("transactions.filterCategoryAria")}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">{tr("transactions.allCategories")}</option>
              {filterCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryLabel(c.name, tr)}
                  {typeFilter === "all"
                    ? ` (${tr(c.type === "income" ? "transactions.income" : "transactions.expense")})`
                    : ""}
                </option>
              ))}
            </select>

            <div className="space-y-1">
              <label htmlFor="date-from" className="text-xs text-muted">
                {tr("transactions.from")}
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="date-to" className="text-xs text-muted">
                {tr("transactions.to")}
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              {tr("transactions.showing", {
                shown: filtered.length,
                total: transactions.length,
              })}
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-foreground hover:underline"
              >
                {tr("transactions.clearFilters")}
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-muted">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              aria-label={tr("transactions.selectAll")}
              className="h-4 w-4 accent-foreground"
            />
            {selectedRows.length > 0
              ? tr("transactions.selected", { count: selectedRows.length })
              : tr("transactions.selectAll")}
          </label>

          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:bg-hover"
              >
                {tr("transactions.clearSelection")}
              </button>
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="rounded-lg bg-expense px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
              >
                {tr("transactions.deleteSelected")}
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-expense">{error}</p>}

      {transactions.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          {tr("dashboard.noTransactions")}
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{tr("transactions.noMatch")}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {filtered.map((t) =>
            editingId === t.id && t.type !== "saving" ? (
              <li key={t.id} className="py-3">
                <TransactionForm
                  categories={categories}
                  transaction={{
                    ...t,
                    type: t.type as "income" | "expense",
                  }}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={t.id} className="flex items-center gap-3 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggleRow(t.id)}
                  aria-label={tr("transactions.selectRow")}
                  className="h-4 w-4 shrink-0 accent-foreground"
                />

                <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate">{rowTitle(t, tr)}</p>
                    <p className="text-muted">{rowSubtitle(t, tr, locale)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={
                        t.type === "income"
                          ? "text-income"
                          : t.type === "expense"
                            ? "text-expense"
                            : ""
                      }
                    >
                      {t.type === "income" ? "+" : "-"}
                      {format(Number(t.amount))}
                    </span>

                    {t.type !== "saving" && (
                      <button
                        type="button"
                        onClick={() => setEditingId(t.id)}
                        aria-label={tr("transactions.editAria")}
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-foreground"
                      >
                        <Pencil size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPendingDelete(t)}
                      aria-label={tr("transactions.deleteAria")}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          deletingSaving
            ? tr("transactions.removeDepositTitle")
            : tr("transactions.deleteTitle")
        }
        message={
          deletingSaving
            ? tr("transactions.removeDepositMessage")
            : tr("transactions.deleteMessage")
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={bulkOpen}
        title={tr("transactions.bulkDeleteTitle", {
          count: selectedRows.length,
        })}
        message={
          hasSavingSelected
            ? `${tr("transactions.bulkDeleteMessage")} ${tr("transactions.bulkDeleteSavings")}`
            : tr("transactions.bulkDeleteMessage")
        }
        loading={bulkDeleting}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkOpen(false)}
      />
    </section>
  );
}