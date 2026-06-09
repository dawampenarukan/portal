"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ARTICLE_FILTER_CATEGORIES,
  beritaFilterHref,
  parseArticleFilter,
  type ArticleFilterCategory,
} from "@/lib/article-categories";
import { cn } from "@/lib/utils";

const TAB_IDLE_COLORS: Record<ArticleFilterCategory, string> = {
  Semua:
    "border border-primary/30 bg-accent/80 text-accent-foreground hover:bg-accent",
  Berita:
    "border border-sky/35 bg-sky/25 text-sky-950 hover:bg-sky/40 hover:border-sky/50",
  Kegiatan:
    "border border-sunny/45 bg-sunny/35 text-amber-900 hover:bg-sunny/50 hover:border-sunny/60",
  Pengumuman:
    "border border-lavender/35 bg-lavender/25 text-purple-900 hover:bg-lavender/40 hover:border-lavender/50",
  Event:
    "border border-secondary/45 bg-secondary/55 text-secondary-foreground hover:bg-secondary/75 hover:border-secondary/60",
};

export function BeritaCategoryFilter() {
  const searchParams = useSearchParams();
  const active = parseArticleFilter(searchParams.get("kategori"));

  return (
    <div className="flex flex-wrap gap-2">
      {ARTICLE_FILTER_CATEGORIES.map((cat) => {
        const isActive = active === cat;
        return (
          <Link key={cat} href={beritaFilterHref(cat)} scroll={false} prefetch={true}>
            <span
              className={cn(
                "inline-flex cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition-all",
                isActive
                  ? "bg-gradient-to-r from-primary to-[#3cb88a] text-white shadow-lg shadow-primary/30 ring-2 ring-white/60"
                  : TAB_IDLE_COLORS[cat]
              )}
            >
              {cat}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
