
"use client";

import { useT } from "./LanguageProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  description: string | null;
};

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted";

const formatInputAmount = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return parts.length > 1
    ? `${integer}.${parts.slice(1).join("")}`
    : integer;
};

const parseInputAmount = (value: string) =>
  Number(value.replace(/\s/g, ""));

export default function GoalForm({
  goal,
  onDone,
}: {
  goal?: Goal;
  onDone?: () => void;
}) {
  const router = useRouter();
  const { t } = useT();
  const isEditing = Boolean(goal);
  const suffix = goal?.id ?? "new";

  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(
    goal ? formatInputAmount(String(goal.target_amount)) : ""
  );
  const [current, setCurrent] = useState(
    goal ? formatInputAmount(String(goal.current_amount)) : ""
  );
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const targetValue = parseInputAmount(target);
    const currentValue = current === "" ? 0 : parseInputAmount(current);

    if (!name.trim()) {
      setError(t("goals.nameError"));
      return;
    }

    if (!targetValue || targetValue <= 0 || !Number.isFinite(targetValue)) {
      setError(t("goals.targetError"));
      return;
    }

    if (
      !Number.isFinite(currentValue) ||
      currentValue < 0
    ) {
      setError(t("goals.savedError"));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const values = {
      name: name.trim(),
      target_amount: targetValue,
      current_amount: currentValue,
      deadline: deadline || null,
      description: description.trim() || null,
    };

    const { error } = goal
      ? await supabase.from("savings_goals").update(values).eq("id", goal.id)
      : await supabase.from("savings_goals").insert(values);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!isEditing) {
      setName("");
      setTarget("");
      setCurrent("");
      setDeadline("");
      setDescription("");
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
        {isEditing ? t("goals.editTitle") : t("goals.newTitle")}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor={`goal-name-${suffix}`} className="text-sm text-muted">
            {t("goals.name")}
          </label>
          <input
            id={`goal-name-${suffix}`}
            type="text"
            maxLength={60}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor={`goal-target-${suffix}`}
            className="text-sm text-muted"
          >
            {t("goals.target")}
          </label>
          <input
            id={`goal-target-${suffix}`}
            type="text"
            inputMode="decimal"
            required
            value={target}
            onChange={(e) => setTarget(formatInputAmount(e.target.value))}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor={`goal-current-${suffix}`}
            className="text-sm text-muted"
          >
            {t("goals.saved")}
          </label>
          <input
            id={`goal-current-${suffix}`}
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={current}
            onChange={(e) => setCurrent(formatInputAmount(e.target.value))}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor={`goal-deadline-${suffix}`}
            className="text-sm text-muted"
          >
            {t("goals.deadline")}
          </label>
          <input
            id={`goal-deadline-${suffix}`}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor={`goal-description-${suffix}`}
            className="text-sm text-muted"
          >
            {t("goals.description")}
          </label>
          <input
            id={`goal-description-${suffix}`}
            type="text"
            maxLength={120}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
          {loading
            ? t("common.saving")
            : isEditing
              ? t("transactions.saveChanges")
              : t("goals.create")}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-lg border border-line py-2 text-sm text-muted transition-colors hover:bg-hover sm:w-auto sm:px-6"
          >
            {t("common.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
