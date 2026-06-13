import { AuthSessionProvider } from "@/components/providers/session-provider";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { OrganolepticEntrySidebar } from "@/components/layout/organoleptic-entry-sidebar";
import { auth } from "@/auth";
import { getNewFeedbackCount } from "@/lib/queries";
import { isFullAdminRole, isOrganolepticEntryRole } from "@/lib/roles";
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
  const isFullAdmin = isFullAdminRole(role);

  if (!isEntryOnly && !isFullAdmin) {
    redirect("/admin/login");
  }

  const newFeedbackCount = isFullAdmin ? await getNewFeedbackCount() : 0;

  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen bg-muted/30">
        {isEntryOnly ? (
          <OrganolepticEntrySidebar />
        ) : (
          <AdminSidebar newFeedbackCount={newFeedbackCount} />
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
