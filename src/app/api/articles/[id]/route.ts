import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { requireAdmin, badRequest, notFound, serverError } from "@/lib/api-auth";
import { validateBackgroundMusicFields } from "@/lib/article-background-music";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { revalidateAdminStats, revalidatePublicContent } from "@/lib/revalidate-public";

type Params = { params: Promise<{ id: string }> };

function optionalTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t || null;
}

function optionalNonNegInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

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

    const nextAudio =
      body.backgroundAudio !== undefined
        ? optionalTrimmedString(body.backgroundAudio)
        : existing.backgroundAudio;
    const nextStart =
      body.backgroundAudioStartSec !== undefined
        ? optionalNonNegInt(body.backgroundAudioStartSec)
        : existing.backgroundAudioStartSec;
    const nextEnd =
      body.backgroundAudioEndSec !== undefined
        ? optionalNonNegInt(body.backgroundAudioEndSec)
        : existing.backgroundAudioEndSec;

    const musicError = validateBackgroundMusicFields({
      url: nextAudio ?? "",
      startSec: nextAudio ? nextStart : null,
      endSec: nextAudio ? nextEnd : null,
    });
    if (musicError) return badRequest(musicError);

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? existing.title,
        slug: (() => {
          const raw =
            body.slug !== undefined
              ? String(body.slug || "")
              : body.title
                ? String(body.title)
                : existing.slug;
          const normalized = slugify(raw.trim() || existing.slug);
          return normalized || existing.slug;
        })(),
        excerpt: body.excerpt !== undefined ? body.excerpt?.trim() || null : existing.excerpt,
        content: body.content ?? existing.content,
        coverImage: body.coverImage !== undefined ? body.coverImage || null : existing.coverImage,
        backgroundAudio: nextAudio,
        backgroundAudioTitle:
          body.backgroundAudioTitle !== undefined
            ? optionalTrimmedString(body.backgroundAudioTitle)
            : existing.backgroundAudioTitle,
        backgroundAudioCredit:
          body.backgroundAudioCredit !== undefined
            ? optionalTrimmedString(body.backgroundAudioCredit)
            : existing.backgroundAudioCredit,
        backgroundAudioStartSec: nextAudio ? nextStart : null,
        backgroundAudioEndSec: nextAudio ? nextEnd : null,
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
    revalidateAdminStats();

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
    revalidateAdminStats();
    return NextResponse.json({ ok: true });
  } catch {
    return notFound("Artikel tidak ditemukan");
  }
}
