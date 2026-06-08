import { MenuCategoryType } from "@prisma/client";

export type MenuCategoryId = "porsi-kecil" | "porsi-besar" | "ibu-hamil" | "balita";

export interface MenuCategory {
  id: MenuCategoryId;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  audience: string;
  color: string;
}

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "porsi-kecil",
    label: "Menu Porsi Kecil",
    shortLabel: "Porsi Kecil",
    emoji: "🧒",
    description:
      "Porsi disesuaikan untuk siswa SD kelas 1–3 dengan nutrisi seimbang dan mudah dikonsumsi.",
    audience: "SD Kelas 1 – 3",
    color: "from-sky/40 to-accent",
  },
  {
    id: "porsi-besar",
    label: "Menu Porsi Besar",
    shortLabel: "Porsi Besar",
    emoji: "🎒",
    description:
      "Porsi lebih besar untuk siswa SD kelas 4–6 dan SMP yang membutuhkan energi lebih.",
    audience: "SD Kelas 4 – SMP",
    color: "from-secondary/60 to-sunny/40",
  },
  {
    id: "ibu-hamil",
    label: "Menu Ibu Hamil",
    shortLabel: "Ibu Hamil",
    emoji: "🤰",
    description:
      "Menu khusus dengan zat besi, asam folat, dan protein tinggi untuk kesehatan ibu dan janin.",
    audience: "Ibu Hamil",
    color: "from-lavender/30 to-coral/20",
  },
  {
    id: "balita",
    label: "Menu Balita",
    shortLabel: "Balita",
    emoji: "👶",
    description: "Tekstur lembut, gizi padat, dan porsi kecil yang aman untuk anak balita.",
    audience: "Balita (1–5 tahun)",
    color: "from-sunny/40 to-secondary/50",
  },
];

export const MENU_CATEGORY_ID_TO_TYPE: Record<MenuCategoryId, MenuCategoryType> = {
  "porsi-kecil": MenuCategoryType.PORSI_KECIL,
  "porsi-besar": MenuCategoryType.PORSI_BESAR,
  "ibu-hamil": MenuCategoryType.IBU_HAMIL,
  balita: MenuCategoryType.BALITA,
};

export const MENU_CATEGORY_TYPE_TO_ID: Record<MenuCategoryType, MenuCategoryId> = {
  [MenuCategoryType.PORSI_KECIL]: "porsi-kecil",
  [MenuCategoryType.PORSI_BESAR]: "porsi-besar",
  [MenuCategoryType.IBU_HAMIL]: "ibu-hamil",
  [MenuCategoryType.BALITA]: "balita",
};

export function getMenuCategory(id: string): MenuCategoryId {
  const found = MENU_CATEGORIES.find((c) => c.id === id);
  return found?.id ?? "porsi-kecil";
}

export function getMenuCategoryMeta(id: MenuCategoryId): MenuCategory {
  return MENU_CATEGORIES.find((c) => c.id === id) ?? MENU_CATEGORIES[0];
}
