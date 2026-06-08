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

export interface FavoriteMenu {
  id: string;
  name: string;
  description: string;
  votes: number;
  emoji: string;
}

export interface MenuCategoryData {
  category: MenuCategory;
  favorites: FavoriteMenu[];
  thisWeek: string[];
}

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "porsi-kecil",
    label: "Menu Porsi Kecil",
    shortLabel: "Porsi Kecil",
    emoji: "🧒",
    description: "Porsi disesuaikan untuk siswa SD kelas 1–3 dengan nutrisi seimbang dan mudah dikonsumsi.",
    audience: "SD Kelas 1 – 3",
    color: "from-sky/40 to-accent",
  },
  {
    id: "porsi-besar",
    label: "Menu Porsi Besar",
    shortLabel: "Porsi Besar",
    emoji: "🎒",
    description: "Porsi lebih besar untuk siswa SD kelas 4–6 dan SMP yang membutuhkan energi lebih.",
    audience: "SD Kelas 4 – SMP",
    color: "from-secondary/60 to-sunny/40",
  },
  {
    id: "ibu-hamil",
    label: "Menu Ibu Hamil",
    shortLabel: "Ibu Hamil",
    emoji: "🤰",
    description: "Menu khusus dengan zat besi, asam folat, dan protein tinggi untuk kesehatan ibu dan janin.",
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

export const MENU_DATA: Record<MenuCategoryId, MenuCategoryData> = {
  "porsi-kecil": {
    category: MENU_CATEGORIES[0],
    favorites: [
      { id: "1", name: "Nasi Ayam Suwir Sayur", description: "Nasi putih, ayam suwir, dan tumis wortel buncis", votes: 128, emoji: "🍗" },
      { id: "2", name: "Sup Ayam Jagung", description: "Sup hangat dengan jagung manis dan telur", votes: 112, emoji: "🌽" },
      { id: "3", name: "Nasi Ikan Bakar Sambal", description: "Ikan bakar tanpa tulang dengan sambal tomat", votes: 98, emoji: "🐟" },
      { id: "4", name: "Bubur Ayam Spesial", description: "Bubur ayam dengan suwiran ayam dan kuah kuning", votes: 87, emoji: "🥣" },
      { id: "5", name: "Mie Kuah Sayur", description: "Mie rebus dengan sayuran dan telur rebus", votes: 76, emoji: "🍜" },
    ],
    thisWeek: ["Senin: Nasi Ayam Suwir", "Selasa: Sup Ayam Jagung", "Rabu: Nasi Ikan Bakar", "Kamis: Bubur Ayam", "Jumat: Mie Kuah Sayur"],
  },
  "porsi-besar": {
    category: MENU_CATEGORIES[1],
    favorites: [
      { id: "1", name: "Nasi Rendang Telur", description: "Rendang sapi empuk dengan telur balado", votes: 156, emoji: "🥩" },
      { id: "2", name: "Nasi Ayam Goreng Lengkap", description: "Ayam goreng, lalapan, dan sambal terasi", votes: 143, emoji: "🍗" },
      { id: "3", name: "Nasi Goreng Spesial", description: "Nasi goreng dengan ayam, bakso, dan acar", votes: 131, emoji: "🍳" },
      { id: "4", name: "Nasi Ikan Lele Goreng", description: "Lele goreng krispi dengan sambal dan lalapan", votes: 119, emoji: "🐟" },
      { id: "5", name: "Nasi Campur Komplit", description: "Nasi, ayam, tempe, tahu, dan sayur bening", votes: 104, emoji: "🍱" },
    ],
    thisWeek: ["Senin: Nasi Rendang Telur", "Selasa: Ayam Goreng Lengkap", "Rabu: Nasi Goreng Spesial", "Kamis: Ikan Lele Goreng", "Jumat: Nasi Campur"],
  },
  "ibu-hamil": {
    category: MENU_CATEGORIES[2],
    favorites: [
      { id: "1", name: "Nasi Hati Ayam Bayam", description: "Hati ayam tumis dengan bayam dan tomat", votes: 67, emoji: "🥬" },
      { id: "2", name: "Sup Kacang Merah Daging", description: "Sup bergizi dengan kacang merah dan daging sapi", votes: 58, emoji: "🫘" },
      { id: "3", name: "Nasi Ikan Kembung Asam", description: "Ikan kembung bumbu asam dengan kangkung", votes: 52, emoji: "🐟" },
      { id: "4", name: "Bubur Kacang Hijau Susu", description: "Bubur kacang hijau dengan susu rendah lemak", votes: 45, emoji: "🥣" },
      { id: "5", name: "Nasi Telur Dadar Sayur", description: "Telur dadar, tumis brokoli, dan pepaya", votes: 41, emoji: "🍳" },
    ],
    thisWeek: ["Senin: Hati Ayam Bayam", "Selasa: Sup Kacang Merah", "Rabu: Ikan Kembung", "Kamis: Bubur Kacang Hijau", "Jumat: Telur Dadar Sayur"],
  },
  balita: {
    category: MENU_CATEGORIES[3],
    favorites: [
      { id: "1", name: "Bubur Beras Tim Ayam", description: "Bubur halus dengan suwiran ayam dan wortel", votes: 43, emoji: "🥣" },
      { id: "2", name: "Puree Ubi & Pisang", description: "Ubi jalar dan pisang kukus dihaluskan", votes: 38, emoji: "🍠" },
      { id: "3", name: "Nasi Tim Telur Tofu", description: "Nasi lembek dengan telur dan tofu lembut", votes: 35, emoji: "🍚" },
      { id: "4", name: "Sup Sayur Sapi Cincang", description: "Daging sapi cincang halus dengan labu siam", votes: 31, emoji: "🥕" },
      { id: "5", name: "Bubur Jagung Keju", description: "Bubur jagung lembut dengan keju rendah garam", votes: 28, emoji: "🌽" },
    ],
    thisWeek: ["Senin: Bubur Ayam Tim", "Selasa: Puree Ubi Pisang", "Rabu: Nasi Tim Tofu", "Kamis: Sup Sapi Cincang", "Jumat: Bubur Jagung"],
  },
};

export function getMenuCategory(id: string): MenuCategoryId {
  const found = MENU_CATEGORIES.find((c) => c.id === id);
  return found?.id ?? "porsi-kecil";
}
