import { NextResponse } from "next/server";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { syncMenuItemFromWeekly } from "@/lib/menu-sync";
import { normalizeMenuIcon } from "@/lib/menu-icons";
import { sortOrderForDay } from "@/lib/week-days";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.weeklyMenuEntry.findUnique({ where: { id } });
    if (!existing) return notFound("Jadwal tidak ditemukan");

    const body = await request.json();
    const nextDayLabel = body.dayLabel?.trim() ?? existing.dayLabel;
    const nextMenuText = body.menuText?.trim() ?? existing.menuText;
    const nextEmoji =
      body.emoji !== undefined ? normalizeMenuIcon(body.emoji) : existing.emoji ?? normalizeMenuIcon(null);

    const entry = await prisma.weeklyMenuEntry.update({
      where: { id },
      data: {
        dayLabel: nextDayLabel,
        menuText: nextMenuText,
        emoji: nextEmoji,
        sortOrder: body.dayLabel ? sortOrderForDay(nextDayLabel) : existing.sortOrder,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      },
    });

    await syncMenuItemFromWeekly(existing.category, nextMenuText, nextEmoji);

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
    return notFound("Jadwal tidak ditemukan");
  }
}
