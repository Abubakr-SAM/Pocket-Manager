"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navLinks } from "./navLinks";
import LogoutButton from "./LogoutButton";
import { useT } from "./LanguageProvider";

const mobileLinks = navLinks;

export default function MobileNav() {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-line bg-background py-3 md:hidden">
      {mobileLinks.map(({ href, labelKey, icon: Icon }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            aria-label={t(labelKey)}
            className={`rounded-lg p-2 transition-colors ${
              isActive ? "bg-hover text-foreground" : "text-muted"
            }`}
          >
            <Icon size={22} />
          </Link>
        );
      })}

      <LogoutButton className="rounded-lg p-2 text-muted">
        <LogOut size={22} />
      </LogoutButton>
    </nav>
  );
}