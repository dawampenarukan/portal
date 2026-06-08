import { NextResponse } from "next/server";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

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
    const { title, description, isActive, questions } = body as {
      title?: string;
      description?: string;
      isActive?: boolean;
      questions?: { question: string; type: string; options?: string[]; order: number }[];
    };

    if (!title?.trim()) return badRequest("Judul survey wajib diisi");

    if (isActive) {
      await prisma.survey.updateMany({ data: { isActive: false } });
    }

    const survey = await prisma.survey.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        isActive: Boolean(isActive),
        questions: {
          create: (questions ?? []).map((q, i) => ({
            question: q.question,
            type: q.type,
            options: q.options ?? undefined,
            order: q.order ?? i,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch {
    return serverError("Gagal membuat survey");
  }
}
