import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { UserAccountsManager } from "@/components/admin/user-accounts-manager";
import { getManageableUsers } from "@/lib/user-queries";

export const metadata = { title: "Kelola Akun" };

export default async function AdminAkunPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  if (session.user.role !== UserRole.SUPER_ADMIN) redirect("/admin");

  const users = await getManageableUsers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Kelola Akun</h2>
        <p className="text-muted-foreground">
          Tambah, hapus, atau ubah password akun admin dan entri organoleptik. Akun entri hanya
          bisa mengelola checklist miliknya sendiri.
        </p>
      </div>
      <UserAccountsManager initialUsers={users} currentUserId={session.user.id} />
    </div>
  );
}
