import Link from "next/link";
import { Suspense } from "react";
import { NewsListItem } from "@/components/news/news-list-item";
import { BeritaCategoryFilter } from "@/components/news/berita-category-filter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedArticlesForListCached } from "@/lib/cached-queries";
import { filterArticlesByCategory, parseArticleFilter } from "@/lib/article-categories";
import { safeQuery } from "@/lib/safe-db";

export const metadata = {
  title: "Berita",
};

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function BeritaPage({ searchParams }: PageProps) {
  const { kategori } = await searchParams;
  const activeFilter = parseArticleFilter(kategori);

  const articles = await safeQuery(
    () => getPublishedArticlesForListCached(),
    [],
    "getPublishedArticles"
  );

  const filtered = filterArticlesByCategory(articles, activeFilter);
  const popular = articles.filter((a) => a.isPopular);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Berita & Informasi</h1>
        <p className="mt-1 text-muted-foreground">
          Berita harian, kegiatan, dan pengumuman terbaru dari SPPG Penarukan 2.
        </p>
      </div>

      <Suspense fallback={<div className="mb-6 h-8 w-64 animate-pulse rounded-full bg-muted" />}>
        <BeritaCategoryFilter />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada artikel untuk kategori{" "}
                  <strong className="text-foreground">{activeFilter}</strong>.
                </p>
              ) : (
                filtered.map((article) => <NewsListItem key={article.id} {...article} />)
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Terpopuler Minggu Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {popular.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada artikel populer.</p>
              ) : (
                popular.map((article, i) => (
                  <Link
                    key={article.id}
                    href={`/berita/${article.slug}`}
                    className="flex gap-3 text-sm"
                  >
                    <span className="font-bold text-primary">{i + 1}.</span>
                    <span className="leading-snug hover:text-primary">{article.title}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Topik Pilihan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {["MBG", "Nutrisi", "Survey", "Event", "Kinerja"].map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
