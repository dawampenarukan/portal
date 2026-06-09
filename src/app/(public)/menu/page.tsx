import { MenuPageContent } from "@/components/menu/menu-page-content";
import { AtmPageHeader } from "@/components/layout/atm-page-shell";
import { getMenuDataByCategoryCached } from "@/lib/cached-queries";
import { getMenuCategory } from "@/lib/menu-meta";
import { safeQuery } from "@/lib/safe-db";
import type { MenuCategoryBundle } from "@/lib/types";

export const revalidate = 30;

export const metadata = {
  title: "Menu Favorit & Request",
  description:
    "Lihat menu favorit dan ajukan request menu untuk Porsi Kecil, Porsi Besar, Ibu Hamil, dan Balita.",
};

const emptyBundle: MenuCategoryBundle = { favorites: [], thisWeek: [], topRequests: [] };

interface PageProps {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function MenuPage({ searchParams }: PageProps) {
  const { kategori } = await searchParams;
  const categoryId = getMenuCategory(kategori ?? "porsi-kecil");

  const initialMenuData = await safeQuery(
    () => getMenuDataByCategoryCached(categoryId),
    emptyBundle,
    "getMenuDataByCategory"
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <AtmPageHeader
        theme="menu"
        emoji="🍽️"
        title="Menu Favorit & Request"
        description="Lihat menu yang paling disukai dan ajukan menu impianmu! Tersedia untuk siswa SD, SMP, ibu hamil, dan balita."
      />

      <MenuPageContent initialCategory={kategori} initialMenuData={initialMenuData} />
    </div>
  );
}
