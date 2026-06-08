import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

interface NewsListItemProps {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  isPopular?: boolean;
}

export function NewsListItem({
  slug,
  title,
  excerpt,
  category,
  publishedAt,
  isPopular,
}: NewsListItemProps) {
  return (
    <article className="flex gap-4 border-b border-border/60 py-4 last:border-b-0">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary/70 to-accent text-3xl">
        📰
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{category}</Badge>
          {isPopular && <Badge variant="popular">🔥 Hits</Badge>}
          <span className="text-xs font-medium text-muted-foreground">
            {formatRelativeTime(publishedAt)}
          </span>
        </div>
        <Link href={`/berita/${slug}`}>
          <h3 className="line-clamp-2 text-base font-bold transition hover:text-primary">
            {title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
      </div>
    </article>
  );
}
