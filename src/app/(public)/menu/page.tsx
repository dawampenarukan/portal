import { MenuPageContent } from "@/components/menu/menu-page-content";
import { getAllMenuData } from "@/lib/queries";
import { getFavoritedMenuItemIds, getVoterKeyFromCookies } from "@/lib/menu-vote";
import { safeQuery } from "@/lib/safe-db";
import { EMPTY_MENU_DATA } from "@/lib/menu-fallbacks";

export const metadata = {
  title: "Menu Favorit & Request",
  description:
    "Lihat menu favorit dan ajukan request menu untuk Porsi Kecil, Porsi Besar, Ibu Hamil, dan Balita.",
};

interface PageProps {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function MenuPage({ searchParams }: PageProps) {
  const { kategori } = await searchParams;
  const [menuData, voterKey] = await Promise.all([
    safeQuery(() => getAllMenuData(), EMPTY_MENU_DATA, "getAllMenuData"),
    getVoterKeyFromCookies(),
  ]);
  const favoritedIds = await getFavoritedMenuItemIds(voterKey);

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

      <MenuPageContent
        initialCategory={kategori}
        menuData={menuData}
        favoritedIds={favoritedIds}
      />
    </div>
  );
}
