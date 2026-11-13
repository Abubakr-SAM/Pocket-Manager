import { redirect } from "next/navigation";
import WelcomeForm from "@/components/WelcomeForm";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarded")
    .eq("id", user.id)
    .single();

  // Allaqachon sozlab bo'lgan foydalanuvchi bu sahifaga qaytmaydi
  if (profile?.onboarded) redirect("/");

  const fullName: string =
    profile?.full_name ?? user.user_metadata?.full_name ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl">
        <WelcomeForm userId={user.id} fullName={fullName} />
      </div>
    </div>
  );
}