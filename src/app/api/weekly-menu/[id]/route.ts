import { NextResponse } from "next/server";
import { requireAdmin, notFound, badRequest, serverError } from "@/lib/api-auth";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { prisma } from "@/lib/prisma";
import { syncMenuItemFromWeekly } from "@/lib/menu-sync";
import { normalizeMenuIcon } from "@/lib/menu-icons";
import { isSchoolWeekDay, resolveOperationalMenuDate, sortOrderForDay } from "@/lib/week-days";
import {
  findWeeklyMenuEntries,
  updateWeeklyMenuEntrySafe,
} from "@/lib/weekly-menu-db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const matched = await findWeeklyMenuEntries({ id });
    const existing = matched[0];
    if (!existing) return notFound("Jadwal tidak ditemukan");

    const body = await request.json();
    const nextDayLabel = body.dayLabel?.trim() ?? existing.dayLabel;
    if (!isSchoolWeekDay(nextDayLabel)) {
      return badRequest("Hari harus Senin–Jumat (hari sekolah)");
    }
    const dayChanged =
      body.dayLabel !== undefined &&
      nextDayLabel.toLowerCase() !== existing.dayLabel.trim().toLowerCase();
    const nextMenuText = body.menuText?.trim() ?? existing.menuText;
    const nextEmoji =
      body.emoji !== undefined ? normalizeMenuIcon(body.emoji) : existing.emoji ?? normalizeMenuIcon(null);
    const nextDescription =
      body.description !== undefined
        ? typeof body.description === "string"
          ? body.description.trim() || null
          : null
        : existing.description;
    const nextImageUrl =
      body.imageUrl !== undefined
        ? typeof body.imageUrl === "string"
          ? body.imageUrl.trim() || null
          : null
        : existing.imageUrl;

    // Pertahankan tanggal Inventory di minggu operasional; realign bila drift (mis. Senin 7).
    const nextMenuDate = resolveOperationalMenuDate(
      nextDayLabel,
      dayChanged ? null : existing.menuDate
    );

    const entry = await updateWeeklyMenuEntrySafe(id, {
      dayLabel: nextDayLabel,
      menuDate: nextMenuDate,
      menuText: nextMenuText,
      description: nextDescription,
      imageUrl: nextImageUrl,
      emoji: nextEmoji,
      sortOrder: dayChanged ? sortOrderForDay(nextDayLabel) : existing.sortOrder,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
    });

    await syncMenuItemFromWeekly(existing.category, nextMenuText, nextEmoji);
    revalidatePublicContent({ menu: true });

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
    revalidatePublicContent({ menu: true });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound("Jadwal tidak ditemukan");
  }
}
