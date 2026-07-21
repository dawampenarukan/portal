import { Suspense } from "react";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import {
  AdminSidebarFallback,
  AdminSidebarWithBadges,
} from "@/components/layout/admin-sidebar-badges";
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

  return (
    <AuthSessionProvider session={session}>
      <div className="flex min-h-screen bg-muted/30">
        {isEntryOnly ? (
          <OrganolepticEntrySidebar />
        ) : (
          <Suspense
            fallback={<AdminSidebarFallback isSuperAdmin={isSuperAdmin} />}
          >
            <AdminSidebarWithBadges isSuperAdmin={isSuperAdmin} />
          </Suspense>
        )}
        <div className="flex flex-1 flex-col">
          <header className="border-b bg-white px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {isEntryOnly ? "Panel Entri Organoleptik" : "Panel Administrasi"}
            </p>
            <h1 className="text-lg font-semibold">SPPG Penarukan 2</h1>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
