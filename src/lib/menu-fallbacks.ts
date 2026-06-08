import type { MenuCategoryId } from "@/lib/menu-meta";
import type { MenuCategoryBundle } from "@/lib/types";

export const EMPTY_MENU_DATA: Record<MenuCategoryId, MenuCategoryBundle> = {
  "porsi-kecil": { favorites: [], thisWeek: [] },
  "porsi-besar": { favorites: [], thisWeek: [] },
  "ibu-hamil": { favorites: [], thisWeek: [] },
  balita: { favorites: [], thisWeek: [] },
};

export const EMPTY_MENU_REQUEST_COUNTS: Record<MenuCategoryId, number> = {
  "porsi-kecil": 0,
  "porsi-besar": 0,
  "ibu-hamil": 0,
  balita: 0,
};
