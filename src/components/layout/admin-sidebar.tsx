"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import {
  MenuOrganolepticNotices,
  type MenuOrganolepticNoticesData,
} from "@/components/layout/menu-organoleptic-notices";
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
  Users,
};

interface AdminSidebarProps {
  newFeedbackCount?: number;
  organolepticNotices?: MenuOrganolepticNoticesData;
}

export function AdminSidebar({
  newFeedbackCount = 0,
  organolepticNotices = { unsafeCount: 0, returnedPackagesCount: 0 },
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;
  const navItems = ADMIN_NAV_ITEMS.filter(
    (item) => item.href !== "/admin/akun" || isSuperAdmin
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-primary text-primary-foreground">
      <div className="border-b border-white/10 p-4">
        <BrandLogo size="sm" tone="light" />
        <p className="mt-2 text-xs text-primary-foreground/70">Panel Admin</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const rowClass = cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
            isActive
              ? "bg-white/15 text-white"
              : "text-primary-foreground/80 hover:bg-white/10 hover:text-white"
          );

          if (item.href === "/admin/menu") {
            return (
              <div key={item.href} className={rowClass}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
                <MenuOrganolepticNotices notices={organolepticNotices} tone="admin" />
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={rowClass}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/masukan" && newFeedbackCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">
                  {newFeedbackCount > 99 ? "99+" : newFeedbackCount}
                </span>
              )}
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
