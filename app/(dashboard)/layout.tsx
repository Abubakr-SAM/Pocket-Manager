import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { getProfileSettings } from "@/lib/get-currency";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo"; 

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { currency, onboarded } = await getProfileSettings();

  if (!onboarded) redirect("/welcome");
  return (
    <CurrencyProvider currency={currency}>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-line bg-background px-6 py-3 md:hidden">
            <span className="flex items-center gap-2 text-lg font-semibold">
              <Logo size={24} />
                Pocket Manager
            </span>
          </header>

          <main className="flex-1 p-6 pb-24 md:p-8">
            {children}
          </main>
        </div>

        <MobileNav />
      </div>
    </CurrencyProvider>
  );
}