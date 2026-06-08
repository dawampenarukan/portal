import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MenuFavoritesSummary } from "@/components/admin/menu-favorites-summary";
import { WeeklyMenuManager } from "@/components/admin/weekly-menu-manager";
import { MenuRequestsManager } from "@/components/admin/menu-requests-manager";
import {
  getMenuCategoryMeta,
  isMenuCategoryId,
  MENU_CATEGORY_ID_TO_TYPE,
  type MenuCategoryId,
} from "@/lib/menu-meta";
import { syncMenuItemsForCategory } from "@/lib/menu-sync";
import { getAdminMenuItems, getAdminWeeklyMenu, getMenuRequests } from "@/lib/queries";
import { safeQuery } from "@/lib/safe-db";
import type { MenuItemAdminView, MenuRequestView, WeeklyMenuEntryView } from "@/lib/types";

export const dynamic = "force-dynamic";

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
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];

  await syncMenuItemsForCategory(categoryId);

  const [items, weekly, requests] = await Promise.all([
    safeQuery(() => getAdminMenuItems(categoryId), [] as MenuItemAdminView[], "admin/getAdminMenuItems"),
    safeQuery(
      () => getAdminWeeklyMenu(categoryId),
      [] as WeeklyMenuEntryView[],
      "admin/getAdminWeeklyMenu"
    ),
    safeQuery(
      () => getMenuRequests(categoryType).then((rows) =>
        rows.map(
          (r): MenuRequestView => ({
            id: r.id,
            requesterName: r.requesterName,
            menuName: r.menuName,
            reason: r.reason,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
          })
        )
      ),
      [] as MenuRequestView[],
      "admin/getMenuRequests"
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/menu" className="text-sm text-primary hover:underline">
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
        <Card>
          <CardContent className="p-6">
            <MenuFavoritesSummary items={items} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <WeeklyMenuManager categoryId={categoryId} initialEntries={weekly} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <MenuRequestsManager initialRequests={requests} />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Perubahan langsung tampil di halaman publik{" "}
        <Link href={`/menu?kategori=${categoryId}`} className="text-primary hover:underline">
          /menu?kategori={categoryId}
        </Link>
      </p>
    </div>
  );
}
