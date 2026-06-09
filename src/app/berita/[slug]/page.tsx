import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArticleCoverImage } from "@/components/news/article-cover-image";
import { ArticleCommentsSection } from "@/components/news/article-comments-section";
import { ListSkeleton } from "@/components/ui/route-skeletons";
import { formatDate } from "@/lib/utils";
import { getArticleBySlugCached } from "@/lib/cached-queries";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlugCached(slug);
  return { title: article?.title ?? "Berita" };
}

export const revalidate = 60;

export default async function BeritaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlugCached(slug);

  if (!article) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge variant="secondary">{article.category}</Badge>
        {article.isPopular && <Badge variant="popular">Terpopuler</Badge>}
      </div>

      <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Oleh {article.author} · {formatDate(article.publishedAt)} · 3 menit baca
      </p>

      <div className="relative my-6 aspect-video overflow-hidden rounded-xl">
        <ArticleCoverImage
          src={article.coverImage}
          alt={article.title}
          fill
          fallbackEmoji="📰"
        />
      </div>

      <div className="prose prose-slate max-w-none whitespace-pre-line">
        <p className="text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <p className="mt-4 leading-relaxed">{article.content}</p>
      </div>

      <div className="mt-10">
        <Suspense fallback={<ListSkeleton rows={3} />}>
          <ArticleCommentsSection articleId={article.id} />
        </Suspense>
      </div>
    </article>
  );
}
