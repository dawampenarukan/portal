"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  ARTICLE_FILTER_CATEGORIES,
  beritaFilterHref,
  parseArticleFilter,
} from "@/lib/article-categories";
import { cn } from "@/lib/utils";

export function BeritaCategoryFilter() {
  const searchParams = useSearchParams();
  const active = parseArticleFilter(searchParams.get("kategori"));

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {ARTICLE_FILTER_CATEGORIES.map((cat) => {
        const isActive = active === cat;
        return (
          <Link key={cat} href={beritaFilterHref(cat)} scroll={false} prefetch={true}>
            <Badge
              variant={isActive ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1 transition-all",
                isActive && "shadow-sm shadow-primary/20"
              )}
            >
              {cat}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
