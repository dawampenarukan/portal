import { NextResponse } from "next/server";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ensureNpsQuestion, normalizeRespondentTarget } from "@/lib/survey-defaults";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const surveys = await prisma.survey.findMany({
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { responses: true } },
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
      questions?: { question: string; type: string; options?: string[]; order: number }[];
    };

    if (!title?.trim()) return badRequest("Judul survey wajib diisi");

    const normalizedQuestions = ensureNpsQuestion(questions ?? []);
    const target = normalizeRespondentTarget(respondentTarget);

    const survey = await prisma.survey.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        respondentTarget: target,
        isActive: Boolean(isActive),
        questions: {
          create: normalizedQuestions.map((q, i) => ({
            question: q.question,
            type: q.type,
            options: q.options ?? undefined,
            order: q.order ?? i,
          })),
        },
      },
      include: { questions: true },
    });

    revalidatePublicContent({ survey: true });

    return NextResponse.json(survey, { status: 201 });
  } catch {
    return serverError("Gagal membuat survey");
  }
}
