import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { requireAdmin, badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { revalidatePublicContent } from "@/lib/revalidate-public";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: true, category: true },
  });
  if (!article) return notFound("Artikel tidak ditemukan");
  return NextResponse.json(article);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) return notFound("Artikel tidak ditemukan");

    const status = body.status as ArticleStatus | undefined;
    const isPublished = status === ArticleStatus.PUBLISHED;

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? existing.title,
        slug: body.slug?.trim() || (body.title ? slugify(body.title) : existing.slug),
        excerpt: body.excerpt !== undefined ? body.excerpt?.trim() || null : existing.excerpt,
        content: body.content ?? existing.content,
        coverImage: body.coverImage !== undefined ? body.coverImage || null : existing.coverImage,
        categoryId: body.categoryId ?? existing.categoryId,
        status: status ?? existing.status,
        isPopular: body.isPopular !== undefined ? Boolean(body.isPopular) : existing.isPopular,
        isHighlight:
          body.isHighlight !== undefined ? Boolean(body.isHighlight) : existing.isHighlight,
        publishedAt: isPublished
          ? body.publishedAt
            ? new Date(body.publishedAt)
            : existing.publishedAt ?? new Date()
          : status === ArticleStatus.DRAFT
            ? null
            : existing.publishedAt,
      },
    });

    revalidatePublicContent({ articles: true });

    return NextResponse.json(article);
  } catch {
    return serverError("Gagal memperbarui artikel");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.article.delete({ where: { id } });
    revalidatePublicContent({ articles: true });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound("Artikel tidak ditemukan");
  }
}
