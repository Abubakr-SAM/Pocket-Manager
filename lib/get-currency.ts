import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { normalizeCurrency } from "@/lib/currency";

// Bitta so'rov ichida bir necha marta chaqirilsa ham, bazaga bir marta boradi
export const getProfileSettings = cache(async () => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("currency, onboarded")
    .maybeSingle();

  return {
    currency: normalizeCurrency(data?.currency),
    // Profil topilmasa, foydalanuvchini tinimsiz yo'naltirmaslik uchun true
    onboarded: data?.onboarded ?? true,
  };
});

export const getCurrency = cache(async () => {
  const { currency } = await getProfileSettings();
  return currency;
});