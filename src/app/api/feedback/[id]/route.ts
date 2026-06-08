import { NextResponse } from "next/server";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) return notFound("Masukan tidak ditemukan");
    return NextResponse.json(feedback);
  } catch {
    return serverError("Gagal memuat masukan");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.feedback.findUnique({ where: { id } });
    if (!existing) return notFound("Masukan tidak ditemukan");

    const body = await request.json();
    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        status: body.status ?? existing.status,
        adminNotes:
          body.adminNotes !== undefined ? body.adminNotes?.trim() || null : existing.adminNotes,
      },
    });

    return NextResponse.json(feedback);
  } catch {
    return serverError("Gagal memperbarui masukan");
  }
}
