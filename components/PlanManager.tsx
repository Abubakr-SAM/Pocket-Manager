"use client";
import { categoryLabel } from "@/lib/i18n/categories";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import ConfirmDialog from "./ConfirmDialog";
import StatCard from "./StatCard";
import { useT } from "./LanguageProvider";

export type PlanItem = {
  id: string;
  name: string;
  amount: number;
  due_date: string | null;
  category_id: string | null;
  category_name: string | null;
  transaction_id: string | null;
};

export type PlanCategory = { id: string; name: string };

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted";

const round = (n: number) => Math.round(n * 100) / 100;
const formatAmount = (amount: number) =>
  amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function monthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const last = new Date(year, month, 0).getDate();

  return {
    min: `${monthKey}-01`,
    max: `${monthKey}-${String(last).padStart(2, "0")}`,
  };
}

export default function PlanManager({
  monthKey,
  items,
  categories,
}: {
  monthKey: string;
  items: PlanItem[];
  categories: PlanCategory[];
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const range = monthRange(monthKey);
  const today = new Date().toLocaleDateString("en-CA");

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PlanItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const planned = round(items.reduce((sum, i) => sum + i.amount, 0));
  const paid = round(
    items.filter((i) => i.transaction_id).reduce((sum, i) => sum + i.amount, 0)
  );
  const left = round(planned - paid);
  const paidPercent = planned > 0 ? Math.round((paid / planned) * 100) : 0;

  const sorted = [...items].sort(
    (a, b) =>
      Number(Boolean(a.transaction_id)) - Number(Boolean(b.transaction_id)) ||
      (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")
  );

  async function addItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);

    const value = Number(amount);
    if (!name.trim()) {
      setAddError(t("plan.nameError"));
      return;
    }
    if (!value || value <= 0) {
      setAddError(t("plan.amountError"));
      return;
    }

    setAdding(true);
    const supabase = createClient();
    const { error } = await supabase.from("planned_payments").insert({
      month: `${monthKey}-01`,
      name: name.trim(),
      amount: value,
      due_date: dueDate || null,
      category_id: categoryId || null,
    });
    setAdding(false);

    if (error) {
      setAddError(error.message);
      return;
    }

    setName("");
    setAmount("");
    setDueDate("");
    setCategoryId("");
    router.refresh();
  }

  function startEdit(item: PlanItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
    setEditDue(item.due_date ?? "");
    setEditError(null);
  }

  async function saveEdit() {
    if (!editingId) return;

    const value = Number(editAmount);
    if (!editName.trim()) {
      setEditError("Enter a name.");
      return;
    }
    if (!value || value <= 0) {
      setEditError(t("plan.amountError"));
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("planned_payments")
      .update({
        name: editName.trim(),
        amount: value,
        due_date: editDue || null,
      })
      .eq("id", editingId);
    setSaving(false);

    if (error) {
      setEditError(error.message);
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  async function togglePaid(item: PlanItem) {
    setBusyId(item.id);
    setListError(null);
    const supabase = createClient();

    // To'langan bo'lsa: tranzaksiyani o'chiramiz, reja o'zi "to'lanmagan"ga qaytadi
    if (item.transaction_id) {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", item.transaction_id);

      setBusyId(null);
      if (error) {
        setListError(error.message);
        return;
      }

      router.refresh();
      return;
    }

    // To'lanmagan bo'lsa: xarajat tranzaksiyasini yozib, rejaga bog'laymiz
    const { data: transaction, error } = await supabase
      .from("transactions")
      .insert({
        type: "expense",
        amount: item.amount,
        category_id: item.category_id,
        description: item.name,
        date: new Date().toLocaleDateString("en-CA"),
      })
      .select("id")
      .single();

    if (error || !transaction) {
      setBusyId(null);
      setListError(error?.message ?? t("plan.recordError"));
      return;
    }

    const { error: linkError } = await supabase
      .from("planned_payments")
      .update({ transaction_id: transaction.id })
      .eq("id", item.id);

    if (linkError) {
      await supabase.from("transactions").delete().eq("id", transaction.id);
      setBusyId(null);
      setListError(linkError.message);
      return;
    }

    setBusyId(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    setListError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("planned_payments")
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
      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title={t("plan.planned")} amount={formatAmount(planned)} />
          <StatCard
            title={t("plan.paid")}
            amount={formatAmount(paid)}
            amountClassName="text-income"
          />
          <StatCard title={t("plan.leftToPay")} amount={formatAmount(left)} />
        </div>

        {planned > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted">
              <span>{t("plan.percentPaid", { percent: paidPercent })}</span>
              <span>
                {t("plan.paidOfPlanned", {
                  paid: formatAmount(paid),
                  planned: formatAmount(planned),
                })}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={t("plan.paidAria")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={paidPercent}
              className="h-2 w-full overflow-hidden rounded-full bg-hover"
            >
              <div
                className={`h-full rounded-full transition-all ${
                  paidPercent >= 100 ? "bg-income" : "bg-foreground"
                }`}
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <form
        onSubmit={addItem}
        className="space-y-4 rounded-xl border border-line bg-card p-6"
      >
        <h2 className="font-medium">{t("plan.addTitle")}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="plan-name" className="text-sm text-muted">
              {t("plan.whatToPay")}
            </label>
            <input
              id="plan-name"
              type="text"
              maxLength={60}
              placeholder={t("plan.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="plan-amount" className="text-sm text-muted">
              {t("transactions.amount")}
            </label>
            <input
              id="plan-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="plan-category" className="text-sm text-muted">
              {t("plan.categoryOptional")}
            </label>
            <select
              id="plan-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">{t("plan.noCategory")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryLabel(c.name, t)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="plan-due" className="text-sm text-muted">
              {t("plan.dueOptional")}
            </label>
            <input
              id="plan-due"
              type="date"
              min={range.min}
              max={range.max}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
          {adding ? t("categories.adding") : t("common.add")}
        </button>
      </form>

      <section className="rounded-xl border border-line bg-card p-6">
        <h2 className="font-medium">{t("plan.payments")}</h2>

        {listError && <p className="mt-2 text-sm text-expense">{listError}</p>}

        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {t("plan.empty")}.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {sorted.map((item) => {
              const isPaid = Boolean(item.transaction_id);
              const overdue =
                !isPaid && item.due_date !== null && item.due_date < today;

              if (editingId === item.id) {
                return (
                  <li key={item.id} className="space-y-3 py-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        aria-label={t("categories.name")}
                        maxLength={60}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        aria-label={t("transactions.amount")}
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="date"
                        aria-label={t("plan.dueAria")}
                        min={range.min}
                        max={range.max}
                        value={editDue}
                        onChange={(e) => setEditDue(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    {editError && (
                      <p className="text-sm text-expense">{editError}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saving}
                        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50"
                      >
                        {saving ? t("common.saving") : t("common.save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:bg-hover"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={item.id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => togglePaid(item)}
                    disabled={busyId === item.id}
                    aria-pressed={isPaid}
                    aria-label={isPaid ? t("plan.markUnpaid") : t("plan.markPaid")}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                      isPaid
                        ? "border-income bg-income text-background"
                        : "border-line text-transparent hover:border-muted hover:text-muted"
                    }`}
                  >
                    <Check size={14} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate ${
                        isPaid ? "text-muted line-through" : ""
                      }`}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-muted">
                      {[
                        item.category_name ? categoryLabel(item.category_name, t) : null,
                        item.due_date ? t("plan.due", { date: formatDate(item.due_date, locale) }) : null
                      ]
                        .filter(Boolean)
                        .join(" · ") || t("plan.noDetails")}
                      {overdue && (
                        <span
                          suppressHydrationWarning
                          className="ml-2 text-expense"
                        >
                          {t("plan.overdue")}
                        </span>
                      )}
                    </p>
                  </div>

                  <span className={isPaid ? "text-muted" : ""}>
                    {formatAmount(item.amount)}
                  </span>

                  <div className="flex shrink-0 items-center">
                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        aria-label={t("plan.editAria", { name: item.name })}
                        className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-foreground"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      aria-label={t("plan.deleteAria", { name: item.name })}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("plan.deleteTitle")}
        message={t("plan.deleteMessage", { name: pendingDelete?.name ?? "" })}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}