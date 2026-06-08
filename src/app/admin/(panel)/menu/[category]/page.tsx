import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";
import { AdminMenuFavoritesSection } from "@/components/admin/admin-menu-favorites-section";
import { AdminMenuWeeklySection } from "@/components/admin/admin-menu-weekly-section";
import { AdminMenuRequestsSection } from "@/components/admin/admin-menu-requests-section";
import { getMenuCategoryMeta, isMenuCategoryId, type MenuCategoryId } from "@/lib/menu-meta";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  if (!isMenuCategoryId(category)) return { title: "Kelola Menu" };
  const meta = getMenuCategoryMeta(category);
  return { title: `Kelola ${meta.label}` };
}

export default async function AdminMenuCategoryPage({ params }: Props) {
  const { category: rawId } = await params;
  if (!isMenuCategoryId(rawId)) notFound();

  const categoryId: MenuCategoryId = rawId;
  const meta = getMenuCategoryMeta(categoryId);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/menu" prefetch={false} className="text-sm text-primary hover:underline">
          ← Kembali ke Kelola Menu
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl">{meta.emoji}</span>
          <div>
            <h2 className="text-2xl font-bold">{meta.label}</h2>
            <p className="text-muted-foreground">{meta.audience}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<AdminCardSkeleton rows={5} />}>
          <AdminMenuFavoritesSection categoryId={categoryId} />
        </Suspense>
        <Suspense fallback={<AdminCardSkeleton rows={6} />}>
          <AdminMenuWeeklySection categoryId={categoryId} />
        </Suspense>
      </div>

      <Suspense fallback={<AdminCardSkeleton rows={3} />}>
        <AdminMenuRequestsSection categoryId={categoryId} />
      </Suspense>

      <p className="text-sm text-muted-foreground">
        Perubahan langsung tampil di halaman publik{" "}
        <Link href={`/menu?kategori=${categoryId}`} className="text-primary hover:underline">
          /menu?kategori={categoryId}
        </Link>
      </p>
    </div>
  );
}
