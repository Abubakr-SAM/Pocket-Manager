"use client";
import { useT } from "./LanguageProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel } from "@/lib/i18n/categories";

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

export type EditableTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category_id: string | null;
  description: string | null;
  date: string;
};

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted";

export default function TransactionForm({
  categories,
  transaction,
  onDone,
}: {
  categories: Category[];
  transaction?: EditableTransaction;
  onDone?: () => void;
}) {
  const router = useRouter();
  const { t: tr } = useT();
  const isEditing = Boolean(transaction);

  const [type, setType] = useState<"income" | "expense">(
    transaction?.type ?? "expense"
  );
  const [amount, setAmount] = useState(
  transaction
    ? Number(transaction.amount).toLocaleString("en-US").replace(/,/g, " ")
    : ""
);
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [description, setDescription] = useState(
    transaction?.description ?? ""
  );
  const [date, setDate] = useState(
    () => transaction?.date ?? new Date().toLocaleDateString("en-CA")
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const visibleCategories = categories.filter((c) => c.type === type);

  function changeType(next: "income" | "expense") {
    setType(next);
    setCategoryId("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const value = Number(amount.replace(/\s/g, ""));
    if (!value || value <= 0) {
      setError(tr("transactions.amountError"));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const values = {
      type,
      amount: value,
      category_id: categoryId,
      description: description.trim() || null,
      date,
    };

    const { error } = transaction
      ? await supabase
          .from("transactions")
          .update(values)
          .eq("id", transaction.id)
      : await supabase.from("transactions").insert(values);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!isEditing) {
      setAmount("");
      setDescription("");
      setCategoryId("");
    }

    setLoading(false);
    router.refresh();
    onDone?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-line bg-card p-6"
    >
      <h2 className="font-medium">
        {isEditing ? tr("transactions.editTitle") : tr("transactions.addTitle")}
      </h2>

      <div className="grid grid-cols-2 gap-2">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => changeType(t)}
            className={`rounded-lg border py-2 text-sm capitalize transition-colors ${
              type === t
                ? "border-foreground bg-foreground text-background"
                : "border-line text-muted hover:bg-hover"
            }`}
          >
            {tr(t === "expense" ? "transactions.expense" : "transactions.income")}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`amount-${transaction?.id ?? "new"}`} className="text-sm text-muted">
            {tr("transactions.amount")}
          </label>
          <input
            id={`amount-${transaction?.id ?? "new"}`}
            type="text"
            inputMode="numeric"
            required
            value={amount}
            onChange={(e) =>
          {
    const digits = e.target.value.replace(/\D/g, "");
    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    setAmount(formatted);
  }}
  className={inputClass}
/>
        </div>

        <div className="space-y-1">
          <label htmlFor={`category-${transaction?.id ?? "new"}`} className="text-sm text-muted">
            {tr("transactions.category")}
          </label>
          <select
            id={`category-${transaction?.id ?? "new"}`}
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">{tr("transactions.selectCategory")}</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c.name, tr)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor={`description-${transaction?.id ?? "new"}`} className="text-sm text-muted">
            {tr("transactions.description")}
          </label>
          <input
            id={`description-${transaction?.id ?? "new"}`}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={`date-${transaction?.id ?? "new"}`} className="text-sm text-muted">
            {tr("transactions.date")}
          </label>
          <input
            id={`date-${transaction?.id ?? "new"}`}
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {loading ? tr("common.saving")
           : isEditing ? tr("transactions.saveChanges")
            : tr("transactions.addButton")}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-lg border border-line py-2 text-sm text-muted transition-colors hover:bg-hover sm:w-auto sm:px-6"
          >
            {tr("common.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}