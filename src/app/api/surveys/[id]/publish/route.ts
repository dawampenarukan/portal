import { NextResponse } from "next/server";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { syncSurveyPublication } from "@/lib/survey-aggregation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const survey = await prisma.survey.findUnique({ where: { id } });
    if (!survey) return notFound("Survey tidak ditemukan");

    const chartData = await syncSurveyPublication(id, { publish: true });
    if (!chartData) return notFound("Survey tidak ditemukan");

    return NextResponse.json({ chartData });
  } catch {
    return serverError("Gagal mempublikasikan hasil survey");
  }
}
