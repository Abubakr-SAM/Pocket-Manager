"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navLinks } from "./navLinks";
import LogoutButton from "./LogoutButton";
import { useT } from "./LanguageProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-col border-r border-line bg-background p-4 md:flex">
      <div className="mb-8 px-3 text-lg font-semibold">Pocket Manager</div>

      <nav className="flex flex-col gap-1">
        {navLinks.map(({ href, labelKey, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-hover text-foreground"
                  : "text-muted hover:bg-hover hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <LogoutButton className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-hover hover:text-foreground">
          <LogOut size={18} />
          {t("nav.logout")}
        </LogoutButton>
      </div>
    </aside>
  );
}