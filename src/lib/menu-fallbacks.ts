import type { MenuCategoryId } from "@/lib/menu-meta";
import type { MenuCategoryBundle } from "@/lib/types";

export const EMPTY_MENU_DATA: Record<MenuCategoryId, MenuCategoryBundle> = {
  "porsi-kecil": { favorites: [], thisWeek: [], topRequests: [] },
  "porsi-besar": { favorites: [], thisWeek: [], topRequests: [] },
  "ibu-hamil": { favorites: [], thisWeek: [], topRequests: [] },
  balita: { favorites: [], thisWeek: [], topRequests: [] },
};

export const EMPTY_MENU_REQUEST_COUNTS: Record<MenuCategoryId, number> = {
  "porsi-kecil": 0,
  "porsi-besar": 0,
  "ibu-hamil": 0,
  balita: 0,
};
