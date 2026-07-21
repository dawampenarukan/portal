import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { revalidateAdminStats, revalidatePublicContent } from "@/lib/revalidate-public";

/** List admin — tanpa content penuh (detail lewat GET /api/articles/[id]). */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      status: true,
      isPopular: true,
      isHighlight: true,
      publishedAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true } },
      author: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      categoryId,
      status,
      isPopular,
      isHighlight,
      publishedAt,
    } = body as Record<string, unknown>;

    if (!title || !content || !categoryId) {
      return badRequest("Judul, konten, dan kategori wajib diisi");
    }

    const articleSlug = (slug as string)?.trim() || slugify(title as string);
    const articleStatus = (status as ArticleStatus) ?? ArticleStatus.DRAFT;
    const isPublished = articleStatus === ArticleStatus.PUBLISHED;

    const article = await prisma.article.create({
      data: {
        title: (title as string).trim(),
        slug: articleSlug,
        excerpt: (excerpt as string)?.trim() || null,
        content: content as string,
        coverImage: (coverImage as string) || null,
        status: articleStatus,
        isPopular: Boolean(isPopular),
        isHighlight: Boolean(isHighlight),
        publishedAt: isPublished
          ? publishedAt
            ? new Date(publishedAt as string)
            : new Date()
          : null,
        authorId: session!.user.id,
        categoryId: categoryId as string,
      },
    });

    revalidatePublicContent({ articles: true });
    revalidateAdminStats();

    return NextResponse.json(article, { status: 201 });
  } catch {
    return serverError("Gagal membuat artikel");
  }
}
