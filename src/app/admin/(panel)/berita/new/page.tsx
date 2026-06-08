import { ArticleForm } from "@/components/admin/article-form";
import { getCategories } from "@/lib/queries";

export const metadata = { title: "Tulis Berita" };

export default async function NewArticlePage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tulis Berita Baru</h2>
        <p className="text-muted-foreground">Buat artikel berita untuk portal publik.</p>
      </div>
      <ArticleForm categories={categories} />
    </div>
  );
}
