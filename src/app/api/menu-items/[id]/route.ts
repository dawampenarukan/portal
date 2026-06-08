import { NextResponse } from "next/server";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.menuItem.findUnique({ where: { id } });
    if (!existing) return notFound();

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        description:
          body.description !== undefined ? body.description?.trim() || null : existing.description,
        emoji: body.emoji !== undefined ? body.emoji || null : existing.emoji,
        votes: body.votes !== undefined ? Number(body.votes) : existing.votes,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    });

    return NextResponse.json(item);
  } catch {
    return serverError("Gagal memperbarui menu");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.menuItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound();
  }
}
