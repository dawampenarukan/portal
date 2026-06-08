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
    const existing = await prisma.weeklyMenuEntry.findUnique({ where: { id } });
    if (!existing) return notFound();

    const entry = await prisma.weeklyMenuEntry.update({
      where: { id },
      data: {
        dayLabel: body.dayLabel?.trim() ?? existing.dayLabel,
        menuText: body.menuText?.trim() ?? existing.menuText,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sortOrder,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    });

    return NextResponse.json(entry);
  } catch {
    return serverError("Gagal memperbarui jadwal menu");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.weeklyMenuEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound();
  }
}
