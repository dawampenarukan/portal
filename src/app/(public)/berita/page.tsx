import Link from "next/link";
import { NewsListItem } from "@/components/news/news-list-item";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedArticlesForListCached } from "@/lib/cached-queries";
import { safeQuery } from "@/lib/safe-db";

const categories = ["Semua", "Berita", "Kegiatan", "Pengumuman", "Event"];

export const metadata = {
  title: "Berita",
};

export const revalidate = 60;

export default async function BeritaPage() {
  const articles = await safeQuery(
    () => getPublishedArticlesForListCached(),
    [],
    "getPublishedArticles"
  );
  const popular = articles.filter((a) => a.isPopular);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Berita & Informasi</h1>
        <p className="mt-1 text-muted-foreground">
          Berita harian, kegiatan, dan pengumuman terbaru dari SPPG Penarukan 2.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={cat === "Semua" ? "default" : "outline"}
            className="cursor-pointer px-3 py-1"
          >
            {cat}
          </Badge>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {articles.map((article) => (
                <NewsListItem key={article.id} {...article} />
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Terpopuler Minggu Ini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {popular.map((article, i) => (
                <Link
                  key={article.id}
                  href={`/berita/${article.slug}`}
                  className="flex gap-3 text-sm"
                >
                  <span className="font-bold text-primary">{i + 1}.</span>
                  <span className="leading-snug hover:text-primary">{article.title}</span>
                </Link>
              ))}
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
