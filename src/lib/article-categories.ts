export const ARTICLE_FILTER_CATEGORIES = [
  "Semua",
  "Berita",
  "Kegiatan",
  "Pengumuman",
  "Event",
] as const;

export type ArticleFilterCategory = (typeof ARTICLE_FILTER_CATEGORIES)[number];

export function parseArticleFilter(value?: string | null): ArticleFilterCategory {
  if (!value?.trim()) return "Semua";
  const normalized = value.trim().toLowerCase();
  const match = ARTICLE_FILTER_CATEGORIES.find((c) => c.toLowerCase() === normalized);
  return match ?? "Semua";
}

export function filterArticlesByCategory<T extends { category: string }>(
  articles: T[],
  filter: ArticleFilterCategory
): T[] {
  if (filter === "Semua") return articles;
  return articles.filter((a) => a.category.toLowerCase() === filter.toLowerCase());
}

export function beritaFilterHref(category: ArticleFilterCategory): string {
  if (category === "Semua") return "/berita";
  return `/berita?kategori=${encodeURIComponent(category)}`;
}
