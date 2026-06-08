import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllArticles } from "@/lib/queries";

export const metadata = { title: "Kelola Berita" };

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

export default async function AdminBeritaPage() {
  const articles = await getAllArticles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kelola Berita</h2>
          <p className="text-muted-foreground">Buat, edit, dan publikasikan artikel berita.</p>
        </div>
        <Link href="/admin/berita/new">
          <Button>
            <Plus className="h-4 w-4" />
            Tulis Berita
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Berita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                    <td className="py-3 pr-4 font-medium">{article.title}</td>
                    <td className="py-3 pr-4">{article.category}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusVariant[article.status ?? "DRAFT"] ?? "secondary"}>
                        {statusLabel[article.status ?? "DRAFT"] ?? article.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Link href={`/admin/berita/${article.id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
