import { NextResponse } from "next/server";
import { FeedbackStatus } from "@prisma/client";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const feedback = await prisma.feedback.findUnique({ where: { id } });
  if (!feedback) return notFound();
  return NextResponse.json(feedback);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.feedback.findUnique({ where: { id } });
    if (!existing) return notFound();

    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        status: (body.status as FeedbackStatus) ?? existing.status,
        adminNotes: body.adminNotes !== undefined ? body.adminNotes?.trim() || null : existing.adminNotes,
      },
    });

    return NextResponse.json(feedback);
  } catch {
    return serverError("Gagal memperbarui masukan");
  }
}
