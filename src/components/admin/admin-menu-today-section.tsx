import { AdminMenuTodayEditor } from "@/components/admin/admin-menu-today-editor";
import { getTodayMenuAdminSnapshot } from "@/lib/menu-today-admin";
import { snapshotSyncKey } from "@/lib/menu-today-snapshot-key";

export async function AdminMenuTodaySection() {
  const snapshot = await getTodayMenuAdminSnapshot();
  return (
    <AdminMenuTodayEditor
      key={snapshotSyncKey(snapshot)}
      initialSnapshot={snapshot}
    />
  );
}
