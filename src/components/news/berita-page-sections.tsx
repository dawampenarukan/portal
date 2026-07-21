import Link from "next/link";
import { NewsListItem } from "@/components/news/news-list-item";
import { AtmPagePanel } from "@/components/layout/atm-page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPopularPublishedArticlesForListCached,
  getPublishedArticlesForListCached,
} from "@/lib/cached-queries";
import {
  filterArticlesByCategory,
  parseArticleFilter,
  type ArticleFilterCategory,
} from "@/lib/article-categories";
import { PUBLISHED_ARTICLES_LIST_TAKE } from "@/lib/queries";
import { safeQuery } from "@/lib/safe-db";

const POPULAR_TAKE = 8;

export async function BeritaArticleList({
  activeFilter,
}: {
  activeFilter: ArticleFilterCategory;
}) {
  const articles = await safeQuery(
    () => getPublishedArticlesForListCached(PUBLISHED_ARTICLES_LIST_TAKE),
    [],
    "getPublishedArticles"
  );
  const filtered = filterArticlesByCategory(articles, activeFilter);

  return (
    <AtmPagePanel variant="main" className="lg:col-span-2">
      <Card className="border-0 bg-white/75 shadow-none backdrop-blur-sm">
        <CardContent className="p-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada artikel untuk kategori{" "}
              <strong className="text-foreground">{activeFilter}</strong>.
            </p>
          ) : (
            filtered.map((article) => (
              <NewsListItem key={article.id} {...article} />
            ))
          )}
        </CardContent>
      </Card>
    </AtmPagePanel>
  );
}

/** Resolve filter di dalam Suspense agar header page tidak menunggu searchParams. */
export async function BeritaArticleListFromParams({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const activeFilter = parseArticleFilter(kategori);
  return <BeritaArticleList activeFilter={activeFilter} />;
}

export async function BeritaPopularAside() {
  const popular = await safeQuery(
    () => getPopularPublishedArticlesForListCached(POPULAR_TAKE),
    [],
    "getPopularPublishedArticles"
  );

  return (
    <aside className="space-y-6">
      <AtmPagePanel variant="sidebar">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky/35 to-lavender/35 text-sm">
                🔥
              </span>
              Terpopuler Minggu Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-0 pb-0">
            {popular.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada artikel populer.
              </p>
            ) : (
              popular.map((article, i) => (
                <Link
                  key={article.id}
                  href={`/berita/${article.slug}`}
                  className="flex gap-3 text-sm"
                >
                  <span className="font-bold text-primary">{i + 1}.</span>
                  <span className="leading-snug hover:text-primary">
                    {article.title}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </AtmPagePanel>

      <AtmPagePanel variant="sidebar">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-sky/35 text-sm">
                🏷️
              </span>
              Topik Pilihan
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 px-0 pb-0">
            {["MBG", "Nutrisi", "Survey", "Event", "Kinerja"].map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </AtmPagePanel>
    </aside>
  );
}
