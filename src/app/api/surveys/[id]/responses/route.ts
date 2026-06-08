import { NextResponse } from "next/server";
import { badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const survey = await prisma.survey.findUnique({
      where: { id, isActive: true },
      include: { questions: true },
    });
    if (!survey) return notFound("Survey tidak ditemukan atau tidak aktif");

    const body = await request.json();
    const { respondentName, answers } = body as {
      respondentName?: string;
      answers?: { questionId: string; value: string }[];
    };

    if (!answers?.length) return badRequest("Jawaban wajib diisi");

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        respondentName: respondentName?.trim() || null,
        answers: {
          create: answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
          })),
        },
      },
    });

    return NextResponse.json({ id: response.id }, { status: 201 });
  } catch {
    return serverError("Gagal menyimpan jawaban survey");
  }
}
