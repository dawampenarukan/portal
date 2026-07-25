import { NextResponse } from "next/server";
import { PublicationType } from "@prisma/client";
import { requireAdmin, badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { revalidatePublicContent } from "@/lib/revalidate-public";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub) return notFound();
  return NextResponse.json(pub);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.publication.findUnique({ where: { id } });
    if (!existing) return notFound();

    const nextType = (body.type ?? existing.type) as PublicationType;
    if (
      existing.type !== PublicationType.SURVEY_RESULT &&
      nextType === PublicationType.SURVEY_RESULT
    ) {
      return badRequest(
        "Tidak bisa mengubah tipe menjadi Hasil Survey. Gunakan Kelola Survey → Tampilkan di Portal."
      );
    }

    const isSurveyResult = existing.type === PublicationType.SURVEY_RESULT;
    const isPublished = body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished;

    const pub = await prisma.publication.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? existing.title,
        slug: isSurveyResult
          ? existing.slug
          : body.slug?.trim() || (body.title ? slugify(body.title) : existing.slug),
        summary: body.summary !== undefined ? body.summary?.trim() || null : existing.summary,
        content: body.content ?? existing.content,
        type: isSurveyResult ? PublicationType.SURVEY_RESULT : nextType,
        period: body.period?.trim() ?? existing.period,
        // chartData + surveyId dikelola sync Survey — jangan ditimpa/diputus
        chartData: isSurveyResult
          ? existing.chartData
          : body.chartData !== undefined
            ? body.chartData
            : existing.chartData,
        surveyId: existing.surveyId,
        isPublished,
        publishedAt: isPublished
          ? body.publishedAt
            ? new Date(body.publishedAt)
            : existing.publishedAt ?? new Date()
          : null,
      },
    });

    revalidatePublicContent({ publications: true, survey: true });

    return NextResponse.json(pub);
  } catch {
    return serverError("Gagal memperbarui publikasi");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.publication.delete({ where: { id } });
    revalidatePublicContent({ publications: true, survey: true });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound();
  }
}
