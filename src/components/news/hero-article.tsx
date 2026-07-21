import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArticleCoverImage } from "@/components/news/article-cover-image";
import { formatRelativeTime } from "@/lib/utils";

interface HeroArticleProps {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  coverImage?: string | null;
}

export function HeroArticle({
  slug,
  title,
  excerpt,
  category,
  author,
  publishedAt,
  coverImage,
}: HeroArticleProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-coral via-primary to-sky text-white shadow-xl">
      <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-6 right-10 h-28 w-28 rounded-full bg-sunny/30" />

      <div className="relative grid gap-6 p-6 md:grid-cols-2 md:p-10">
        <div className="flex flex-col justify-center">
          <Badge className="mb-4 w-fit border-0 bg-white/25 text-white hover:bg-white/25">
            🔥 {category}
          </Badge>
          <Link href={`/berita/${slug}`}>
            <h1 className="text-2xl font-extrabold leading-tight transition hover:underline md:text-4xl">
              {title}
            </h1>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-white/90 md:text-base">{excerpt}</p>
          <p className="mt-4 text-xs font-medium text-white/75">
            ✍️ {author} · {formatRelativeTime(publishedAt)}
          </p>
          <Link
            href={`/berita/${slug}`}
            className="mt-6 inline-flex w-fit rounded-full bg-white px-6 py-2.5 text-sm font-bold text-primary shadow-md transition hover:scale-105"
          >
            Baca selengkapnya →
          </Link>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-white/15 backdrop-blur-sm">
          <ArticleCoverImage
            src={coverImage}
            alt={title}
            fill
            priority
            fallbackEmoji="🍽️"
            className="rounded-2xl"
            sizes="(max-width: 768px) 100vw, 50vw"
          />

        </div>
      </div>
    </section>
  );
}
