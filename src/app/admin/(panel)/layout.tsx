import { Suspense } from "react";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import {
  AdminSidebarFallback,
  AdminSidebarWithBadges,
} from "@/components/layout/admin-sidebar-badges";
import { AdminShell } from "@/components/layout/admin-shell";
import { OrganolepticEntrySidebar } from "@/components/layout/organoleptic-entry-sidebar";
import { auth } from "@/auth";
import { isFullAdminRole, isOrganolepticEntryRole } from "@/lib/roles";
import { USER_ROLE_SUPER_ADMIN } from "@/lib/user-constants";
import { redirect } from "next/navigation";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user) {
    redirect("/admin/login");
  }

  const isEntryOnly = isOrganolepticEntryRole(role);
  const isSuperAdmin = role === USER_ROLE_SUPER_ADMIN;

  if (!isEntryOnly && !isFullAdminRole(role)) {
    redirect("/admin/login");
  }

  const sidebar = isEntryOnly ? (
    <OrganolepticEntrySidebar />
  ) : (
    <Suspense fallback={<AdminSidebarFallback isSuperAdmin={isSuperAdmin} />}>
      <AdminSidebarWithBadges isSuperAdmin={isSuperAdmin} />
    </Suspense>
  );

  return (
    <AuthSessionProvider session={session}>
      <AdminShell
        sidebar={sidebar}
        subtitle={
          isEntryOnly ? "Panel Entri Organoleptik" : "Panel Administrasi"
        }
        title="SPPG Penarukan 2"
      >
        {children}
      </AdminShell>
    </AuthSessionProvider>
  );
}
