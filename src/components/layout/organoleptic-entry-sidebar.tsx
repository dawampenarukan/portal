"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { usePathname } from "next/navigation";
import { List, Plus } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/menu/organoleptik", label: "Daftar Checklist", icon: List },
  { href: "/admin/menu/organoleptik/new", label: "Input Checklist", icon: Plus },
] as const;

export function OrganolepticEntrySidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-0 w-full flex-1 flex-col border-r bg-primary text-primary-foreground">
      <div className="border-b border-white/10 p-4">
        <BrandLogo size="sm" tone="light" />
        <p className="mt-2 text-xs text-primary-foreground/70">Entri Uji Organoleptik</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/admin/menu/organoleptik" &&
              pathname.startsWith("/admin/menu/organoleptik/") &&
              pathname !== "/admin/menu/organoleptik/new");

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-primary-foreground/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-1">
        <Link
          href="/"
          prefetch={false}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary-foreground/80 transition hover:bg-white/10 hover:text-white"
        >
          ← Portal Publik
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
