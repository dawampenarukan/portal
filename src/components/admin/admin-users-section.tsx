import { SchemaSyncBanner } from "@/components/admin/schema-sync-banner";
import { UserAccountsManager } from "@/components/admin/user-accounts-manager";
import { getSchemaStatus } from "@/lib/db-schema-sync";
import { getManageableUsers } from "@/lib/user-queries";

interface AdminUsersSectionProps {
  currentUserId: string;
}

export async function AdminUsersSection({ currentUserId }: AdminUsersSectionProps) {
  const schemaStatus = await getSchemaStatus();

  try {
    const users = await getManageableUsers();
    return (
      <div className="space-y-4">
        <SchemaSyncBanner initialStatus={schemaStatus} />
        <UserAccountsManager initialUsers={users} currentUserId={currentUserId} />
      </div>
    );
  } catch (err) {
    console.error("[admin/akun]", err);
    return (
      <div className="space-y-4">
        <SchemaSyncBanner initialStatus={schemaStatus} />
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <p className="font-semibold text-destructive">Gagal memuat daftar akun</p>
          <p className="text-sm text-muted-foreground">
            Klik <strong>Perbarui Schema Database</strong> di atas, lalu muat ulang halaman.
          </p>
        </div>
      </div>
    );
  }
}
