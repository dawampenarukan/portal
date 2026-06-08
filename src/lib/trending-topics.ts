import type { TrendingTopicView } from "@/lib/types";

export const FALLBACK_TRENDING_TOPICS: TrendingTopicView[] = [
  { id: "fallback-menu", title: "Menu Favorit Minggu Ini 🍽️", href: "/menu" },
  {
    id: "fallback-menu-kecil",
    title: "Request Menu Porsi Kecil 🧒",
    href: "/menu?kategori=porsi-kecil",
  },
  {
    id: "fallback-ibu-hamil",
    title: "Tips Gizi Buat Ibu Hamil 🤰",
    href: "/menu?kategori=ibu-hamil",
  },
  { id: "fallback-survey", title: "Yuk Isi Survey! ⭐", href: "/kinerja" },
];

/** Normalisasi cache lama (string[]) atau data tidak lengkap. */
export function normalizeTrendingTopics(raw: unknown): TrendingTopicView[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return FALLBACK_TRENDING_TOPICS;
  }

  const normalized: TrendingTopicView[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];

    if (typeof item === "string" && item.trim()) {
      normalized.push({
        id: `legacy-${i}`,
        title: item,
        href: "/berita",
      });
      continue;
    }

    if (item && typeof item === "object") {
      const record = item as Partial<TrendingTopicView>;
      const title = record.title?.trim();
      const href = record.href?.trim();
      if (title && href) {
        normalized.push({
          id: record.id?.trim() || `topic-${i}`,
          title,
          href,
        });
      }
    }
  }

  return normalized.length > 0 ? normalized : FALLBACK_TRENDING_TOPICS;
}
