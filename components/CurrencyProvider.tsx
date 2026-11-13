"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { formatCompact, formatMoney } from "@/lib/format";

type CurrencyContextValue = {
  currency: string;
  format: (value: number) => string;
  compact: (value: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  format: (value) => formatMoney(value),
  compact: (value) => formatCompact(value),
});

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      currency,
      format: (amount: number) => formatMoney(amount, currency),
      compact: (amount: number) => formatCompact(amount, currency),
    }),
    [currency]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}