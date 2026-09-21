import { after, NextResponse } from "next/server";
import { PublicationType } from "@prisma/client";
import { badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { normalizeOptionList, validateSurveyAnswers } from "@/lib/survey-defaults";
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
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!survey) return notFound("Survey tidak ditemukan atau tidak aktif");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return badRequest("Body permintaan tidak valid");
    }

    const { respondentName, respondentAge, respondentSchool, answers } = body as {
      respondentName?: string;
      respondentAge?: number;
      respondentSchool?: string;
      answers?: { questionId: string; value: string }[];
    };

    const name = respondentName?.trim() ?? "";
    const schoolName = respondentSchool?.trim() ?? "";
    const age =
      typeof respondentAge === "number" ? respondentAge : parseInt(String(respondentAge ?? ""), 10);
    if (!name || name.length > 120) {
      return badRequest("Nama wajib diisi (maks. 120 karakter)");
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return badRequest("Umur wajib diisi (1–120)");
    }
    if (!schoolName || schoolName.length > 200) {
      return badRequest("Nama sekolah/posyandu wajib diisi (maks. 200 karakter)");
    }

    const questionsForValidation = survey.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: normalizeOptionList(q.options),
    }));

    const validated = validateSurveyAnswers(questionsForValidation, answers);
    if (!validated.ok) return badRequest(validated.error);

    const response = await prisma.$transaction(async (tx) =>
      tx.surveyResponse.create({
        data: {
          surveyId: id,
          respondentName: name,
          respondentAge: age,
          respondentSchool: schoolName,
          answers: {
            create: validated.answers.map((a) => ({
              questionId: a.questionId,
              value: a.value,
            })),
          },
        },
      })
    );

    after(async () => {
      try {
        const published = await prisma.publication.findFirst({
          where: {
            type: PublicationType.SURVEY_RESULT,
            isPublished: true,
            OR: [
              { surveyId: id },
              { slug: buildSurveyPublicationSlug(survey.title), surveyId: null },
            ],
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
