import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { validateBackgroundMusicFields } from "@/lib/article-background-music";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { revalidateAdminStats, revalidatePublicContent } from "@/lib/revalidate-public";

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
      backgroundAudio,
      backgroundAudioTitle,
      backgroundAudioCredit,
      backgroundAudioStartSec,
      backgroundAudioEndSec,
      categoryId,
      status,
      isPopular,
      isHighlight,
      publishedAt,
    } = body as Record<string, unknown>;

    if (!title || !content || !categoryId) {
      return badRequest("Judul, konten, dan kategori wajib diisi");
    }

    const audioUrl = optionalTrimmedString(backgroundAudio);
    const startSec = optionalNonNegInt(backgroundAudioStartSec);
    const endSec = optionalNonNegInt(backgroundAudioEndSec);
    const musicError = validateBackgroundMusicFields({
      url: audioUrl ?? "",
      startSec,
      endSec,
    });
    if (musicError) return badRequest(musicError);

    const articleSlug = slugify(
      ((slug as string)?.trim() || (title as string) || "").toString()
    );
    if (!articleSlug) {
      return badRequest("Slug tidak valid");
    }
    const articleStatus = (status as ArticleStatus) ?? ArticleStatus.DRAFT;
    const isPublished = articleStatus === ArticleStatus.PUBLISHED;

    const article = await prisma.article.create({
      data: {
        title: (title as string).trim(),
        slug: articleSlug,
        excerpt: (excerpt as string)?.trim() || null,
        content: content as string,
        coverImage: (coverImage as string) || null,
        backgroundAudio: audioUrl,
        backgroundAudioTitle: optionalTrimmedString(backgroundAudioTitle),
        backgroundAudioCredit: optionalTrimmedString(backgroundAudioCredit),
        backgroundAudioStartSec: audioUrl ? startSec : null,
        backgroundAudioEndSec: audioUrl ? endSec : null,
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
  } catch (err) {
    console.error("[articles] POST error:", err);
    const message =
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2003"
        ? "Sesi tidak valid. Silakan logout lalu login ulang."
        : "Gagal membuat artikel";
    return serverError(message);
  }
}
