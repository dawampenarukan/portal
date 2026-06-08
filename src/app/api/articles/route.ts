import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { requireAdmin, badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const articles = await prisma.article.findMany({
    include: { author: true, category: true },
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

    return NextResponse.json(article, { status: 201 });
  } catch {
    return serverError("Gagal membuat artikel");
  }
}
