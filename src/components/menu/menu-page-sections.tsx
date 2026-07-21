import { MenuPageContent } from "@/components/menu/menu-page-content";
import { getMenuDataByCategoryCached } from "@/lib/cached-queries";
import { getMenuCategory } from "@/lib/menu-meta";
import { safeQuery } from "@/lib/safe-db";
import type { MenuCategoryBundle } from "@/lib/types";

const emptyBundle: MenuCategoryBundle = {
  favorites: [],
  thisWeek: [],
  topRequests: [],
};

/** Await searchParams di dalam Suspense — header page bisa stream lebih dulu. */
export async function MenuPageBody({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const categoryId = getMenuCategory(kategori ?? "porsi-kecil");
  const initialMenuData = await safeQuery(
    () => getMenuDataByCategoryCached(categoryId),
    emptyBundle,
    "getMenuDataByCategory"
  );

  return (
    <MenuPageContent
      key={categoryId}
      initialCategory={categoryId}
      initialMenuData={initialMenuData}
    />
  );
}
