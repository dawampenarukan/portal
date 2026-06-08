import { NextResponse } from "next/server";
import { requireAdmin, badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { responses: true } },
    },
  });
  if (!survey) return notFound();
  return NextResponse.json(survey);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.survey.findUnique({ where: { id } });
    if (!existing) return notFound();

    if (body.isActive) {
      await prisma.survey.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }

    if (body.questions) {
      await prisma.surveyQuestion.deleteMany({ where: { surveyId: id } });
      await prisma.surveyQuestion.createMany({
        data: (body.questions as { question: string; type: string; options?: string[]; order: number }[]).map(
          (q, i) => ({
            surveyId: id,
            question: q.question,
            type: q.type,
            options: q.options ?? undefined,
            order: q.order ?? i,
          })
        ),
      });
    }

    const survey = await prisma.survey.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? existing.title,
        description:
          body.description !== undefined ? body.description?.trim() || null : existing.description,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(survey);
  } catch {
    return serverError("Gagal memperbarui survey");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.survey.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound();
  }
}
