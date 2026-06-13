import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminUsersSection } from "@/components/admin/admin-users-section";
import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";
import { USER_ROLE_SUPER_ADMIN } from "@/lib/user-constants";

export const metadata = { title: "Kelola Akun" };

export const dynamic = "force-dynamic";

export default async function AdminAkunPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  if (session.user.role !== USER_ROLE_SUPER_ADMIN) redirect("/admin");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Kelola Akun</h2>
        <p className="text-muted-foreground">
          Tambah, hapus, atau ubah password akun admin dan entri organoleptik. Akun entri hanya
          bisa mengelola checklist miliknya sendiri.
        </p>
      </div>
      <Suspense fallback={<AdminCardSkeleton rows={4} />}>
        <AdminUsersSection currentUserId={session.user.id} />
      </Suspense>
    </div>
  );
}
