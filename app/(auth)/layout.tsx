import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">
          <Logo size={48} className="mx-auto mb-4" />
          <h1 className="mb-8 text-center text-2xl font-semibold">
            Pocket Manager
          </h1>
          {children}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}   