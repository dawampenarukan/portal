import { MenuPageContent } from "@/components/menu/menu-page-content";
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

const emptyBundle: MenuCategoryBundle = { favorites: [], thisWeek: [] };

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
      <div className="mb-8 text-center">
        <span className="text-5xl">🍽️</span>
        <h1 className="mt-3 text-2xl font-extrabold text-primary md:text-3xl">
          Menu Favorit & Request
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Lihat menu yang paling disukai dan ajukan menu impianmu! Tersedia untuk siswa SD,
          SMP, ibu hamil, dan balita.
        </p>
      </div>

      <MenuPageContent initialCategory={kategori} initialMenuData={initialMenuData} />
    </div>
  );
}
