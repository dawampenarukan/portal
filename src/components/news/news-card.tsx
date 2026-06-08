import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";

const categoryEmoji: Record<string, string> = {
  Berita: "📰",
  Kegiatan: "🎯",
  Pengumuman: "📢",
  Event: "🎉",
};

interface NewsCardProps {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  isPopular?: boolean;
  isHighlight?: boolean;
}

export function NewsCard({
  slug,
  title,
  excerpt,
  category,
  author,
  publishedAt,
  isPopular,
  isHighlight,
}: NewsCardProps) {
  return (
    <Card className="charming-card group overflow-hidden border-0">
      <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-secondary/60 via-accent to-sky/40 text-5xl">
        {categoryEmoji[category] ?? "📄"}
      </div>
      <CardContent className="p-5">
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{category}</Badge>
          {isPopular && <Badge variant="popular">🔥 Hits</Badge>}
          {isHighlight && <Badge variant="highlight">✨ Sorotan</Badge>}
        </div>
        <Link href={`/berita/${slug}`}>
          <h3 className="line-clamp-2 text-base font-extrabold leading-snug transition group-hover:text-primary">
            {title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          {author} · {formatRelativeTime(publishedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
