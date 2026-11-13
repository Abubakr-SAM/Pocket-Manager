"use client";
import { useT } from "./LanguageProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted";

export default function ProfileForm({
  userId,
  email,
  initialName,
}: {
  userId: string;
  email: string;
  initialName: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const name = fullName.trim();
    if (!name) {
      setError(t("profile.nameEmpty"));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: name },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setFullName(name);
    setSaved(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-line bg-card p-6"
    >
      <h2 className="font-medium">{t("profile.title")}</h2>

      <div className="space-y-1">
        <label htmlFor="profile-name" className="text-sm text-muted">
          {t("profile.fullName")}
        </label>
        <input
          id="profile-name"
          type="text"
          maxLength={60}
          required
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setSaved(false);
          }}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="profile-email" className="text-sm text-muted">
          {t("profile.email")}
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          disabled
          className={`${inputClass} cursor-not-allowed opacity-60`}
        />
        <p className="text-xs text-muted">{t("profile.emailNote")}</p>
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}
      {saved && <p className="text-sm text-income">{t("profile.updated")}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50 sm:w-auto sm:px-6"
      >
        {loading ? t("common.saving") : t("profile.save")}
      </button>
    </form>
  );
}