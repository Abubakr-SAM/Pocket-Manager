import {
  LayoutDashboard,
  ArrowLeftRight,
  ListChecks,
  TrendingUp,
  Target,
  Tag,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export const navLinks: {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
  { href: "/plan", labelKey: "nav.plan", icon: ListChecks },
  { href: "/statistics", labelKey: "nav.statistics", icon: TrendingUp },
  { href: "/goals", labelKey: "nav.goals", icon: Target },
  { href: "/categories", labelKey: "nav.categories", icon: Tag },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];  