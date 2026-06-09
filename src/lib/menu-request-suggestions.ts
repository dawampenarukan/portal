import type { MenuNameSuggestion } from "@/lib/types";

export function scoreMenuNameMatch(query: string, name: string): number {
  const q = query.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (!q || !n) return 0;
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (q.startsWith(n)) return 70;
  if (n.includes(q)) return 60;
  if (q.includes(n)) return 50;

  const qWords = q.split(/\s+/).filter((word) => word.length > 1);
  const nWords = n.split(/\s+/);
  const overlap = qWords.filter((word) =>
    nWords.some((part) => part.includes(word) || word.includes(part))
  ).length;

  return overlap > 0 ? 40 + overlap * 10 : 0;
}

export function filterMenuNameSuggestions(
  items: MenuNameSuggestion[],
  query: string,
  limit = 6
): MenuNameSuggestion[] {
  const q = query.trim();
  if (!q) return [];

  return items
    .map((item) => ({ ...item, score: scoreMenuNameMatch(q, item.name) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.requestCount - a.requestCount ||
        a.name.localeCompare(b.name, "id")
    )
    .slice(0, limit)
    .map(({ name, requestCount }) => ({ name, requestCount }));
}
