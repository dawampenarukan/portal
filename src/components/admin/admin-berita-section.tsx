import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaginationNav } from "@/components/admin/pagination-nav";
import { getAdminArticlesList } from "@/lib/queries";

const statusVariant: Record<string, "success" | "secondary" | "outline"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

const statusLabel: Record<string, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

export async function AdminBeritaList({ page }: { page: number }) {
  const { items: articles, total } = await getAdminArticlesList(page);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daftar Berita</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mobile: cards */}
        <div className="space-y-3 md:hidden">
          {articles.map((article) => (
            <div key={article.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-medium leading-snug">{article.title}</p>
                <Badge
                  variant={statusVariant[article.status ?? "DRAFT"] ?? "secondary"}
                  className="shrink-0"
                >
                  {statusLabel[article.status ?? "DRAFT"] ?? article.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{article.category}</p>
              <Link
                href={`/admin/berita/${article.id}/edit`}
                prefetch={false}
                className="mt-3 inline-block"
              >
                <Button variant="outline" size="sm" className="min-h-11">
                  Edit
                </Button>
              </Link>
            </div>
          ))}
          {articles.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada berita.</p>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Judul</th>
                <th className="pb-3 pr-4 font-medium">Kategori</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b last:border-0">
                  <td className="max-w-xs truncate py-3 pr-4 font-medium">
                    {article.title}
                  </td>
                  <td className="py-3 pr-4">{article.category}</td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={statusVariant[article.status ?? "DRAFT"] ?? "secondary"}
                    >
                      {statusLabel[article.status ?? "DRAFT"] ?? article.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Link href={`/admin/berita/${article.id}/edit`} prefetch={false}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationNav basePath="/admin/berita" page={page} total={total} />
      </CardContent>
    </Card>
  );
}

export function AdminBeritaHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold">Kelola Berita</h2>
        <p className="text-muted-foreground">
          Buat, edit, dan publikasikan artikel berita.
        </p>
      </div>
      <Link href="/admin/berita/new" prefetch={false} className="shrink-0">
        <Button>
          <Plus className="h-4 w-4" />
          Tulis Berita
        </Button>
      </Link>
    </div>
  );
}
