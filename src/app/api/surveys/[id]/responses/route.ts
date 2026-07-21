import { after, NextResponse } from "next/server";
import { PublicationType } from "@prisma/client";
import { badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import {
  buildSurveyPublicationSlug,
  syncSurveyPublication,
} from "@/lib/survey-aggregation";

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

    const validQuestionIds = new Set(survey.questions.map((q) => q.id));
    if (answers.some((a) => !validQuestionIds.has(a.questionId))) {
      return badRequest("Pertanyaan tidak valid untuk survey ini");
    }

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

    const surveyTitle = survey.title;

    // Sync publikasi + revalidate setelah response dikirim — tidak blokir submit.
    after(async () => {
      try {
        const published = await prisma.publication.findFirst({
          where: {
            slug: buildSurveyPublicationSlug(surveyTitle),
            type: PublicationType.SURVEY_RESULT,
            isPublished: true,
          },
          select: { id: true },
        });
        await syncSurveyPublication(id, { publish: Boolean(published) });
        revalidatePublicContent({ survey: true, publications: true });
      } catch (err) {
        console.error("[survey:sync]", err);
      }
    });

    return NextResponse.json({ id: response.id }, { status: 201 });
  } catch (err) {
    console.error("[survey:response]", err);
    return serverError("Gagal menyimpan jawaban survey");
  }
}
