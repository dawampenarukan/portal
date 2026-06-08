"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  UtensilsCrossed,
} from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import { ADMIN_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  LayoutDashboard,
  UtensilsCrossed,
  Newspaper,
  Calendar,
  BarChart3,
  MessageSquare,
  Inbox,
  ClipboardList,
};

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-primary text-primary-foreground">
      <div className="border-b border-white/10 p-4">
        <BrandLogo size="sm" tone="light" />
        <p className="mt-2 text-xs text-primary-foreground/70">Panel Admin</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-primary-foreground/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary-foreground/80 transition hover:bg-white/10 hover:text-white"
        >
          ← Portal Publik
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
