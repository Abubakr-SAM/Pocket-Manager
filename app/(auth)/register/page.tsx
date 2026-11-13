"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LanguageProvider";
import { authError } from "@/lib/i18n/auth";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useT();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(authError(error.message, t));
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-line bg-card p-6"
    >
      <h2 className="text-lg font-medium">{t("auth.createAccount")}</h2>

      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm text-muted">
          {t("profile.fullName")}
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm text-muted">
          {t("auth.email")}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm text-muted">
          {t("auth.password")}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted"
        />
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50"
      >
        {loading ? t("auth.creating") : t("auth.createAccount")}
      </button>

      <p className="text-center text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="text-foreground hover:underline">
          {t("auth.login")}
        </Link>
      </p>
    </form>
  );
}