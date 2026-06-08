import { AuthSessionProvider } from "@/components/providers/session-provider";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { getNewFeedbackCount } from "@/lib/queries";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const newFeedbackCount = await getNewFeedbackCount();

  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen bg-muted/30">
        <AdminSidebar newFeedbackCount={newFeedbackCount} />
        <div className="flex flex-1 flex-col">
          <header className="border-b bg-white px-6 py-4">
            <p className="text-sm text-muted-foreground">Panel Administrasi</p>
            <h1 className="text-lg font-semibold">SPPG Penarukan 2</h1>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
