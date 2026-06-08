import { FeedbackStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin, badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const validStatuses = new Set<string>(Object.values(FeedbackStatus));

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.menuRequest.findUnique({ where: { id } });
    if (!existing) return notFound("Request tidak ditemukan");

    const body = await request.json();
    const { status, menuItemId } = body as { status?: string; menuItemId?: string | null };

    if (status && !validStatuses.has(status)) {
      return badRequest("Status tidak valid");
    }

    const updated = await prisma.menuRequest.update({
      where: { id },
      data: {
        status: status ? (status as FeedbackStatus) : existing.status,
        menuItemId: menuItemId !== undefined ? menuItemId : existing.menuItemId,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return serverError("Gagal memperbarui request menu");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.menuRequest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound("Request tidak ditemukan");
  }
}
