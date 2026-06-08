import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "@/components/news/comment-section";
import { formatDate } from "@/lib/utils";
import { mockArticles, mockComments } from "@/lib/mock-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = mockArticles.find((a) => a.slug === slug);
  return { title: article?.title ?? "Berita" };
}

export default async function BeritaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = mockArticles.find((a) => a.slug === slug);

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

      <div className="my-6 aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-secondary/30" />

      <div className="prose prose-slate max-w-none">
        <p className="text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <p className="mt-4 leading-relaxed">
          Konten artikel lengkap akan ditampilkan di sini setelah modul CMS berita
          terhubung ke database. Saat ini halaman ini menggunakan data contoh untuk
          demonstrasi tampilan detail berita dan fitur komentar.
        </p>
        <p className="mt-4 leading-relaxed">
          SPPG Penarukan 2 berkomitmen menyampaikan informasi yang akurat dan bermanfaat
          bagi masyarakat, orang tua siswa, dan seluruh pemangku kepentingan program
          makan bergizi.
        </p>
      </div>

      <div className="mt-10">
        <CommentSection comments={mockComments} />
      </div>
    </article>
  );
}
