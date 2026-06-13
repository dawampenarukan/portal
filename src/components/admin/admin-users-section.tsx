import { UserAccountsManager } from "@/components/admin/user-accounts-manager";
import { getManageableUsers } from "@/lib/user-queries";

interface AdminUsersSectionProps {
  currentUserId: string;
}

export async function AdminUsersSection({ currentUserId }: AdminUsersSectionProps) {
  try {
    const users = await getManageableUsers();
    return <UserAccountsManager initialUsers={users} currentUserId={currentUserId} />;
  } catch (err) {
    console.error("[admin/akun]", err);
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
        <p className="font-semibold text-destructive">Gagal memuat daftar akun</p>
        <p className="text-sm text-muted-foreground">
          Database production mungkin belum di-update dengan schema terbaru (role entri organoleptik).
          Jalankan perintah berikut dari mesin lokal:
        </p>
        <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs">
{`npm run env:pull
npm run db:deploy
npm run db:ensure-admin`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Setelah itu, muat ulang halaman ini. Cek juga status di{" "}
          <a href="/api/health" className="text-primary underline" target="_blank" rel="noreferrer">
            /api/health
          </a>
          .
        </p>
      </div>
    );
  }
}
