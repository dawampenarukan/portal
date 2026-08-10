/**
 * Metadata kategori menu — aman untuk client bundle (tanpa @prisma/client).
 * Nilai string di bawah selaras dengan enum Prisma MenuCategoryType
 * dan KATEGORI_PORSI_OPTIONS di Inventory (Rencana Produksi).
 */

export type MenuCategoryId = "porsi-kecil" | "porsi-besar" | "ibu-hamil" | "balita";

/** Mirror string enum Prisma MenuCategoryType — jangan import Prisma di sini. */
export type MenuCategoryTypeId =
  | "PORSI_KECIL"
  | "PORSI_BESAR"
  | "IBU_HAMIL"
  | "BALITA";

export interface MenuCategory {
  id: MenuCategoryId;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  audience: string;
  color: string;
}

/**
 * Urutan & copy selaras Inventory Food Production → Kategori Porsi:
 * PORSI_BESAR, PORSI_KECIL, POSYANDU_BUMIL_BUSUI, POSYANDU_BALITA
 */
export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "porsi-besar",
    label: "Porsi Besar Sekolah",
    shortLabel: "Porsi Besar Sekolah",
    emoji: "🎒",
    description:
      "Porsi besar sekolah untuk SD 4–6, SMP, SMA, dan Tendik sesuai acuan Rencana Produksi.",
    audience: "SD 4–6 + SMP + SMA + Tendik",
    color: "from-secondary/60 to-sunny/40",
  },
  {
    id: "porsi-kecil",
    label: "Porsi Kecil Sekolah",
    shortLabel: "Porsi Kecil Sekolah",
    emoji: "🧒",
    description:
      "Porsi kecil sekolah untuk KB, PAUD, TK, dan SD 1–3 sesuai acuan Rencana Produksi.",
    audience: "KB + PAUD + TK + SD 1–3",
    color: "from-sky/40 to-accent",
  },
  {
    id: "ibu-hamil",
    label: "Porsi Besar Posyandu",
    shortLabel: "Porsi Besar Posyandu",
    emoji: "🤰",
    description: "Porsi besar Posyandu untuk ibu hamil dan menyusui.",
    audience: "Bumil + Busui",
    color: "from-lavender/30 to-coral/20",
  },
  {
    id: "balita",
    label: "Porsi Kecil Posyandu",
    shortLabel: "Porsi Kecil Posyandu",
    emoji: "👶",
    description: "Porsi kecil Posyandu untuk balita usia 1–5 tahun.",
    audience: "Balita 1–5",
    color: "from-sunny/40 to-secondary/50",
  },
];

export const MENU_CATEGORY_ID_TO_TYPE: Record<MenuCategoryId, MenuCategoryTypeId> = {
  "porsi-kecil": "PORSI_KECIL",
  "porsi-besar": "PORSI_BESAR",
  "ibu-hamil": "IBU_HAMIL",
  balita: "BALITA",
};

export const MENU_CATEGORY_TYPE_TO_ID: Record<MenuCategoryTypeId, MenuCategoryId> = {
  PORSI_KECIL: "porsi-kecil",
  PORSI_BESAR: "porsi-besar",
  IBU_HAMIL: "ibu-hamil",
  BALITA: "balita",
};

export function getMenuCategory(id: string): MenuCategoryId {
  const found = MENU_CATEGORIES.find((c) => c.id === id);
  return found?.id ?? "porsi-kecil";
}

export function isMenuCategoryId(value: string): value is MenuCategoryId {
  return value in MENU_CATEGORY_ID_TO_TYPE;
}

export function isMenuCategoryTypeId(value: string): value is MenuCategoryTypeId {
  return value in MENU_CATEGORY_TYPE_TO_ID;
}

export function getMenuCategoryMeta(id: MenuCategoryId): MenuCategory {
  return MENU_CATEGORIES.find((c) => c.id === id) ?? MENU_CATEGORIES[0];
}
