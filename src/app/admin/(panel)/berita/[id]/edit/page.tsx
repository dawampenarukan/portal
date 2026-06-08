import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/article-form";
import { getArticleById, getCategories } from "@/lib/queries";

export const metadata = { title: "Edit Berita" };

type Props = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const [article, categories] = await Promise.all([getArticleById(id), getCategories()]);

  if (!article) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Edit Berita</h2>
        <p className="text-muted-foreground">{article.title}</p>
      </div>
      <ArticleForm categories={categories} article={article} />
    </div>
  );
}
