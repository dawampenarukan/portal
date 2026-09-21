import { NextResponse } from "next/server";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureNpsQuestion,
  normalizeOptionList,
  normalizeRespondentTarget,
  validateSurveyQuestionDraft,
  type SurveyQuestionInput,
} from "@/lib/survey-defaults";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const surveys = await prisma.survey.findMany({
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: {
        select: {
          responses: { where: { answers: { some: {} } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(surveys);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { title, description, isActive, respondentTarget, questions } = body as {
      title?: string;
      description?: string;
      isActive?: boolean;
      respondentTarget?: number;
      questions?: SurveyQuestionInput[];
    };

    if (!title?.trim()) return badRequest("Judul survey wajib diisi");

    const normalizedQuestions = ensureNpsQuestion(
      (questions ?? []).map((q) => ({
        question: String(q.question ?? ""),
        type: String(q.type ?? "rating"),
        options: normalizeOptionList(q.options),
        order: Number(q.order) || 0,
      }))
    );

    const draftError = validateSurveyQuestionDraft(normalizedQuestions);
    if (draftError) return badRequest(draftError);

    const target = normalizeRespondentTarget(respondentTarget);

    const survey = await prisma.$transaction(async (tx) =>
      tx.survey.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          respondentTarget: target,
          isActive: Boolean(isActive),
          questions: {
            create: normalizedQuestions.map((q, i) => ({
              question: q.question,
              type: q.type,
              options: q.options && q.options.length > 0 ? q.options : undefined,
              order: q.order ?? i,
            })),
          },
        },
        include: { questions: { orderBy: { order: "asc" } } },
      })
    );

    revalidatePublicContent({ survey: true });

    return NextResponse.json(survey, { status: 201 });
  } catch (err) {
    console.error("[survey:create]", err);
    return serverError("Gagal membuat survey");
  }
}
