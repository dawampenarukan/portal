import { NextResponse } from "next/server";
import {
  requireAdmin,
  notFound,
  serverError,
  badRequest,
  conflict,
} from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureNpsQuestion,
  hasStructuralQuestionChanges,
  missingQuestionIds,
  normalizeOptionList,
  normalizeRespondentTarget,
  validateSurveyQuestionDraft,
  type SurveyQuestionInput,
} from "@/lib/survey-defaults";
import { syncSurveyQuestions } from "@/lib/survey-questions";
import { syncSurveyPublication } from "@/lib/survey-aggregation";
import { revalidatePublicContent } from "@/lib/revalidate-public";

type Params = { params: Promise<{ id: string }> };

function mapPublicQuestions(
  questions: { id: string; question: string; type: string; options: unknown; order: number }[]
) {
  return questions.map((q) => {
    const options = normalizeOptionList(q.options);
    return {
      id: q.id,
      question: q.question,
      type: q.type,
      options: options.length > 0 ? options : null,
      order: q.order,
    };
  });
}

/**
 * Admin: full survey + responseCount.
 * Publik (unauthenticated): hanya survey aktif, tanpa metrik internal.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const { error: adminError } = await requireAdmin();

  if (!adminError) {
    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        _count: {
          select: {
            responses: { where: { answers: { some: {} } } },
          },
        },
      },
    });
    if (!survey) return notFound();
    return NextResponse.json({
      ...survey,
      questions: mapPublicQuestions(survey.questions),
      responseCount: survey._count.responses,
    });
  }

  const survey = await prisma.survey.findUnique({
    where: { id, isActive: true },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!survey) return notFound("Survey tidak ditemukan atau tidak aktif");

  return NextResponse.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    respondentTarget: survey.respondentTarget,
    isActive: survey.isActive,
    questions: mapPublicQuestions(survey.questions),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        _count: {
          select: {
            responses: { where: { answers: { some: {} } } },
          },
        },
      },
    });
    if (!existing) return notFound();

    const responseCount = existing._count.responses;
    const forceStructuralEdit = Boolean(body.forceStructuralEdit);

    let incomingQuestions: SurveyQuestionInput[] | null = null;
    if (body.questions) {
      incomingQuestions = ensureNpsQuestion(
        (body.questions as SurveyQuestionInput[]).map((q) => ({
          id: typeof q.id === "string" ? q.id : undefined,
          question: String(q.question ?? ""),
          type: String(q.type ?? "rating"),
          options: normalizeOptionList(q.options),
          order: Number(q.order) || 0,
        }))
      );

      const draftError = validateSurveyQuestionDraft(incomingQuestions);
      if (draftError) return badRequest(draftError);

      const structural = hasStructuralQuestionChanges(
        existing.questions,
        incomingQuestions
      );

      if (structural && responseCount > 0 && !forceStructuralEdit) {
        return conflict(
          "Survey sudah punya jawaban. Mengubah tipe/opsi, menambah, atau menghapus pertanyaan dapat menghapus jawaban terkait. Centang konfirmasi lalu simpan ulang.",
          { code: "STRUCTURAL_EDIT_REQUIRED", responseCount }
        );
      }
    }

    const survey = await prisma.$transaction(async (tx) => {
      if (incomingQuestions) {
        const idsToRemove = missingQuestionIds(
          existing.questions,
          incomingQuestions
        );
        await syncSurveyQuestions(
          tx,
          id,
          incomingQuestions,
          existing.questions,
          {
            allowDelete:
              responseCount === 0 ||
              (forceStructuralEdit && idsToRemove.length > 0),
          }
        );
      }

      return tx.survey.update({
        where: { id },
        data: {
          title: body.title?.trim() ?? existing.title,
          description:
            body.description !== undefined
              ? body.description?.trim() || null
              : existing.description,
          respondentTarget:
            body.respondentTarget !== undefined
              ? normalizeRespondentTarget(body.respondentTarget)
              : existing.respondentTarget,
          isActive:
            body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        },
        include: { questions: { orderBy: { order: "asc" } } },
      });
    });

    let hasLinkedPublication = false;
    try {
      hasLinkedPublication = Boolean(
        await prisma.publication.findFirst({
          where: { surveyId: id },
          select: { id: true },
        })
      );
    } catch {
      hasLinkedPublication = false;
    }
    if (hasLinkedPublication) {
      await syncSurveyPublication(id);
      revalidatePublicContent({ survey: true, publications: true });
    } else {
      revalidatePublicContent({ survey: true });
    }

    return NextResponse.json({
      ...survey,
      questions: mapPublicQuestions(survey.questions),
    });
  } catch (err) {
    console.error("[survey:patch]", err);
    if (err instanceof Error && err.message === "STRUCTURAL_DELETE_BLOCKED") {
      return conflict(
        "Tidak dapat menghapus pertanyaan pada survey yang sudah punya jawaban tanpa konfirmasi.",
        { code: "STRUCTURAL_EDIT_REQUIRED" }
      );
    }
    return serverError("Gagal memperbarui survey");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.survey.delete({ where: { id } });
    revalidatePublicContent({ survey: true, publications: true });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound();
  }
}
