import { NextResponse } from "next/server";
import { PublicationType } from "@prisma/client";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { aggregateSurveyResults } from "@/lib/survey-aggregation";
import { slugify } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) return notFound("Survey tidak ditemukan");

    const chartData = await aggregateSurveyResults(id);
    const period = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const slug = slugify(`hasil-survey-${survey.title}`);

    const existing = await prisma.publication.findFirst({
      where: { slug, type: PublicationType.SURVEY_RESULT },
    });

    const publication = existing
      ? await prisma.publication.update({
          where: { id: existing.id },
          data: {
            title: `Hasil Survey: ${survey.title}`,
            summary: `Skor kepuasan ${chartData.satisfactionScore}/5 dengan ${chartData.respondents} responden.`,
            chartData,
            isPublished: true,
            publishedAt: new Date(),
          },
        })
      : await prisma.publication.create({
          data: {
            title: `Hasil Survey: ${survey.title}`,
            slug,
            period,
            type: PublicationType.SURVEY_RESULT,
            summary: `Skor kepuasan ${chartData.satisfactionScore}/5 dengan ${chartData.respondents} responden.`,
            content: `Ringkasan hasil survey ${survey.title}.`,
            chartData,
            isPublished: true,
            publishedAt: new Date(),
          },
        });

    return NextResponse.json({ publication, chartData });
  } catch {
    return serverError("Gagal mempublikasikan hasil survey");
  }
}
