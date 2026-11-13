"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CURRENCIES } from "@/lib/currency";
import { formatDate, formatMoney } from "@/lib/format";
import ConfirmDialog from "./ConfirmDialog";
import { useT } from "./LanguageProvider";


const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-muted";

export default function CurrencyForm({
  userId,
  initialCurrency,
}: {
  userId: string;
  initialCurrency: string;
}) {
  const { t, locale } = useT();
  const router = useRouter();
  const latestRequest = useRef(0);

  const [currency, setCurrency] = useState(initialCurrency);
  const [convert, setConvert] = useState(true);
  const [rate, setRate] = useState("");
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const changed = currency !== initialCurrency;
  const rateValue = Number(rate);
  const rateValid = Number.isFinite(rateValue) && rateValue > 0;

  async function handleCurrencyChange(next: string) {
    const requestId = ++latestRequest.current;

    setCurrency(next);
    setMessage(null);
    setError(null);
    setRate("");
    setRateDate(null);
    setRateError(null);

    if (next === initialCurrency) {
      setLoadingRate(false);
      return;
    }

    setLoadingRate(true);

    try {
      const response = await fetch(
        `/api/rates?from=${initialCurrency}&to=${next}`
      );
      const data = await response.json();

      if (requestId !== latestRequest.current) return;
      if (!response.ok) throw new Error(data.error ?? "Rate error");

      setRate(String(data.rate));
      setRateDate(data.updatedAt ?? null);
    } catch {
      if (requestId !== latestRequest.current) return;
      setRateError(t("currency.rateLoadError"));
    } finally {
      if (requestId === latestRequest.current) setLoadingRate(false);
    }
  }

  async function apply(withConversion: boolean) {
    setSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    const { error } = withConversion
      ? await supabase.rpc("convert_user_currency", {
          p_rate: rateValue,
          p_new_currency: currency,
        })
      : await supabase.from("profiles").update({ currency }).eq("id", userId);

    setSaving(false);
    setConfirmOpen(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      withConversion
        ? t("currency.converted", { from: initialCurrency, rate, to: currency })
        : t("currency.updated")
    );
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!changed) return;

    if (convert) {
      if (!rateValid) {
        setError(t("currency.rateInvalid"));
        return;
      }
      setConfirmOpen(true);
      return;
    }

    apply(false);
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-line bg-card p-6"
      >
        <h2 className="font-medium">{t("currency.title")}</h2>

        <div className="space-y-1">
          <label htmlFor="currency" className="text-sm text-muted">
            {t("currency.display")}
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            {t("currency.preview", { value: formatMoney(1234567.89, currency) })}
          </p>
        </div>

        {changed && (
          <div className="space-y-3 rounded-lg border border-line p-4">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={convert}
                onChange={(e) => setConvert(e.target.checked)}
                className="mt-1"
              />
              <span>{t("currency.convertCheck")}</span>
            </label>

            {convert ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="shrink-0 text-muted">
                    1 {initialCurrency} =
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    aria-label={t("currency.rateAria")}
                    placeholder={loadingRate ? t("currency.rateLoading") : t("currency.ratePlaceholder")}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className={inputClass}
                  />
                  <span className="shrink-0 text-muted">{currency}</span>
                </div>

                {rateError && (
                  <p className="text-xs text-expense">{rateError}</p>
                )}

                {rateValid && (
                  <p className="text-xs text-muted">
                    {formatMoney(100, initialCurrency)} →{" "}
                    {formatMoney(100 * rateValue, currency)}
                  </p>
                )}

                {rateDate && (
                  <p className="text-xs text-muted">
                    {t("currency.liveRate",
                    { date: formatDate(rateDate, locale)
                    }
                    )} {" "}
                    <a
                      href="https://www.exchangerate-api.com"
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-foreground"
                    >
                      Exchange Rate API
                    </a>
                    
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted">
                {t("currency.keepAmounts")}
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-expense">{error}</p>}
        {message && <p className="text-sm text-income">{message}</p>}

        <button
          type="submit"
          disabled={saving || !changed || (convert && loadingRate)}
          className="w-full rounded-lg bg-foreground py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {saving
            ? t("common.saving")
            : changed && convert
              ? t("currency.convertSave")
              : t("currency.save")}
        </button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title={t("currency.confirmTitle")}
        message={t("currency.confirmMessage", { from: initialCurrency, to: currency, rate })}
        confirmLabel={t("currency.convertButton")}
        destructive={false}
        loading={saving}
        onConfirm={() => apply(true)}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}