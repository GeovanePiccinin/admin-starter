"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

import { navigationItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  function handleThemeToggle(): void {
    setTheme(isDark ? "light" : "dark");
  }

  async function handleLogout(): Promise<void> {
    await signOut({
      redirectTo: "/login",
    });
  }

  function renderNavigationItem(item: (typeof navigationItems)[number]) {
    const Icon = item.icon;

    const link = (
      <Link
        href={item.href}
        className={[
          "flex items-center rounded-md py-2 text-sm font-medium",
          "transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
        ].join(" ")}
      >
        <Icon className="size-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );

    if (!collapsed) {
      return link;
    }

    return (
      <Tooltip>
        <TooltipTrigger render={link}>
          <span className="sr-only">{item.label}</span>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <aside
      className={[
        "fixed top-0 left-0 z-40 h-screen flex flex-col border-r overflow-y-auto",
        "bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-16 items-center border-b",
          collapsed ? "justify-center" : "justify-between px-4",
        ].join(" ")}
      >
        {!collapsed && (
          <span className="font-semibold tracking-tight">Agendamento</span>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navigationItems.map((item) => (
          <div key={item.href}>{renderNavigationItem(item)}</div>
        ))}
      </nav>

      <Separator />

      <div className="space-y-1 p-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                className={[
                  "w-full",
                  collapsed ? "justify-center px-2" : "justify-start gap-3",
                ].join(" ")}
                onClick={handleThemeToggle}
              />
            }
          >
            {isDark ? (
              <Sun className="size-4 shrink-0" />
            ) : (
              <Moon className="size-4 shrink-0" />
            )}

            {!collapsed && <span>{isDark ? "Tema claro" : "Tema escuro"}</span>}
          </TooltipTrigger>

          {collapsed && (
            <TooltipContent side="right">
              {isDark ? "Tema claro" : "Tema escuro"}
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                className={[
                  "w-full",
                  collapsed ? "justify-center px-2" : "justify-start gap-3",
                ].join(" ")}
                onClick={handleLogout}
              />
            }
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </TooltipTrigger>

          {collapsed && <TooltipContent side="right">Sair</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
}
