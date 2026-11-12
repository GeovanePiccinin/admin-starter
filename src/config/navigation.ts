import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  LayoutDashboard,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Itens de exemplo",
    href: "/example-items",
    icon: Boxes,
  },
];
