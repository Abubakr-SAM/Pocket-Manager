import CurrencyForm from "@/components/CurrencyForm";
import ProfileForm from "@/components/ProfileForm";
import ThemeForm from "@/components/ThemeForm";
import { normalizeCurrency } from "@/lib/currency";
import AboutCard from "@/components/AboutCard";
import { createClient } from "@/lib/supabase/server";
import LanguageForm from "@/components/LanguageForm";
import { getT } from "@/lib/i18n/server";

export default async function SettingsPage() {
  const t = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, currency")
    .eq("id", user.id)
    .single();

  const fullName: string =
    profile?.full_name ?? user.user_metadata?.full_name ?? "";
  const currency = normalizeCurrency(profile?.currency);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">{t("settings.title")}, Manage your account. → {t("settings.subtitle")}</h1>
        <p className="text-muted">Manage your account.</p>
      </header>

            <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProfileForm
            userId={user.id}
            email={user.email ?? ""}
            initialName={fullName}
          />
          <CurrencyForm userId={user.id} initialCurrency={currency} />
        </div>

        <div className="space-y-6">
          <ThemeForm />
          <LanguageForm />
          <AboutCard />
        </div>
      </div>
    </div>
  );
}