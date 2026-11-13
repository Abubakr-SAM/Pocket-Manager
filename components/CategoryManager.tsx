"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel } from "@/lib/i18n/categories";
import type { Translate } from "@/lib/i18n";
import ConfirmDialog from "./ConfirmDialog";
import { useT } from "./LanguageProvider";
import type { Category } from "./TransactionForm";

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted";

function friendlyError(
  error: { code?: string; message: string },
  tr: Translate
) {
  return error.code === "23505" ? tr("categories.duplicate") : error.message;
}

export default function CategoryManager({
  categories,
  usage,
}: {
  categories: Category[];
  usage: Record<string, number>;
}) {
  const router = useRouter();
  const { t: tr } = useT();

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  async function addCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);

    const name = newName.trim();
    if (!name) {
      setAddError(tr("categories.nameRequired"));
      return;
    }

    setAdding(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .insert({ name, type: newType });
    setAdding(false);

    if (error) {
      setAddError(friendlyError(error, tr));
      return;
    }

    setNewName("");
    router.refresh();
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editingId) return;

    const name = editName.trim();
    if (!name) {
      setEditError(tr("profile.nameEmpty"));
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", editingId);
    setSaving(false);

    if (error) {
      setEditError(friendlyError(error, tr));
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setListError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", pendingDelete.id);

    setPendingDelete(null);

    if (error) {
      setListError(error.message);
      return;
    }

    router.refresh();
  }

  const pendingCount = pendingDelete ? (usage[pendingDelete.id] ?? 0) : 0;
  const pendingName = pendingDelete
    ? categoryLabel(pendingDelete.name, tr)
    : "";

  function renderGroup(type: "income" | "expense", title: string) {
    const items = categories.filter((c) => c.type === type);

    return (
      <section className="rounded-xl border border-line bg-card p-6">
        <h2 className="font-medium">{title}</h2>

        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{tr("categories.empty")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {items.map((c) =>
              editingId === c.id ? (
                <li key={c.id} className="space-y-2 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      aria-label={tr("categories.nameAria")}
                      maxLength={30}
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
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
                      aria-label={tr("categories.saveAria")}
                      className="rounded-lg p-2 text-income transition-colors hover:bg-hover disabled:opacity-50"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label={tr("categories.cancelAria")}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-hover"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {editError && (
                    <p className="text-sm text-expense">{editError}</p>
                  )}
                </li>
              ) : (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate">{categoryLabel(c.name, tr)}</p>
                    <p className="text-muted">
                      {tr(
                        (usage[c.id] ?? 0) === 1
                          ? "categories.usedOne"
                          : "categories.usedMany",
                        { count: usage[c.id] ?? 0 }
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      aria-label={tr("categories.renameAria", {
                        name: categoryLabel(c.name, tr),
                      })}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-foreground"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(c)}
                      aria-label={tr("categories.deleteAria", {
                        name: categoryLabel(c.name, tr),
                      })}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-hover hover:text-expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={addCategory}
        className="space-y-4 rounded-xl border border-line bg-card p-6"
      >
        <h2 className="font-medium">{tr("categories.addTitle")}</h2>

        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setNewType(t)}
              className={`rounded-lg border py-2 text-sm transition-colors ${
                newType === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-line text-muted hover:bg-hover"
              }`}
            >
              {tr(t === "expense" ? "transactions.expense" : "transactions.income")}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="category-name" className="text-sm text-muted">
            {tr("categories.name")}
          </label>
          <input
            id="category-name"
            type="text"
            maxLength={30}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={inputClass}
          />
        </div>

        {addError && <p className="text-sm text-expense">{addError}</p>}

        <button
          type="submit"
          disabled={adding}
          className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {adding ? tr("categories.adding") : tr("categories.addTitle")}
        </button>
      </form>

      {listError && <p className="text-sm text-expense">{listError}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {renderGroup("expense", tr("categories.expenseGroup"))}
        {renderGroup("income", tr("categories.incomeGroup"))}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={tr("categories.deleteTitle")}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        message={
          pendingCount > 0
            ? tr(
                pendingCount === 1
                  ? "categories.deleteUsedOne"
                  : "categories.deleteUsedMany",
                { count: pendingCount, name: pendingName }
              )
            : tr("categories.deleteTitle")
        }
      />
    </div>
  );
}