import { NextResponse } from "next/server";
import { PublicationType } from "@prisma/client";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const publications = await prisma.publication.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(publications);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { title, slug, summary, content, type, period, chartData, isPublished, publishedAt } =
      body as Record<string, unknown>;

    if (!title || !content || !type || !period) {
      return badRequest("Judul, konten, tipe, dan periode wajib diisi");
    }

    const pub = await prisma.publication.create({
      data: {
        title: (title as string).trim(),
        slug: (slug as string)?.trim() || slugify(title as string),
        summary: (summary as string)?.trim() || null,
        content: content as string,
        type: type as PublicationType,
        period: (period as string).trim(),
        chartData: type === PublicationType.SURVEY_RESULT ? undefined : (chartData ?? undefined),
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? (publishedAt ? new Date(publishedAt as string) : new Date()) : null,
      },
    });

    revalidatePublicContent({ publications: true, survey: true });

    return NextResponse.json(pub, { status: 201 });
  } catch {
    return serverError("Gagal membuat publikasi");
  }
}
