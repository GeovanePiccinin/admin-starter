import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CalendarDays,
  LayoutDashboard,
  Users,
  HardHat,
  ClipboardCheck,
  FileText,
  CreditCard,
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
    label: "Serviços",
    href: "/services",
    icon: BriefcaseBusiness,
  },
  {
    label: "Clientes",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Profissionais",
    href: "/professionals",
    icon: HardHat,
  },
  {
    label: "Agendamentos",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    label: "Atendimentos",
    href: "/attendances",
    icon: ClipboardCheck,
  },
  {
    label: "Fichas de clientes",
    href: "/client-records",
    icon: FileText,
  },
  {
    label: "Pagamentos",
    href: "/payments",
    icon: CreditCard,
  },
];
