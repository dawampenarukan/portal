import "server-only";

import type { MenuCategoryType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type WeeklyMenuRowSelect = {
  id: string;
  category: MenuCategoryType;
  dayLabel: string;
  menuDate: string | null;
  menuText: string;
  emoji: string | null;
  sortOrder: number;
  isActive: boolean;
};

function isMissingMenuDateColumn(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("menuDate") &&
    (msg.includes("Unknown column") ||
      msg.includes("does not exist") ||
      msg.includes("Unknown arg") ||
      msg.includes("Unknown field") ||
      msg.includes("column") ||
      msg.includes("Available options"))
  );
}

/**
 * Baca WeeklyMenuEntry dengan menuDate bila kolom sudah ada di DB.
 * Fallback tanpa menuDate agar deploy Vercel tidak crash sebelum `db:deploy`.
 */
export async function findWeeklyMenuEntries(
  where: Prisma.WeeklyMenuEntryWhereInput
): Promise<WeeklyMenuRowSelect[]> {
  try {
    const rows = await prisma.weeklyMenuEntry.findMany({
      where,
      select: {
        id: true,
        category: true,
        dayLabel: true,
        menuDate: true,
        menuText: true,
        emoji: true,
        sortOrder: true,
        isActive: true,
      },
    });
    return rows.map((r) => ({ ...r, menuDate: r.menuDate ?? null }));
  } catch (err) {
    if (!isMissingMenuDateColumn(err)) throw err;
    const rows = await prisma.weeklyMenuEntry.findMany({
      where,
      select: {
        id: true,
        category: true,
        dayLabel: true,
        menuText: true,
        emoji: true,
        sortOrder: true,
        isActive: true,
      },
    });
    return rows.map((r) => ({ ...r, menuDate: null as string | null }));
  }
}

export async function createWeeklyMenuEntrySafe(data: {
  category: MenuCategoryType;
  dayLabel: string;
  menuDate?: string | null;
  menuText: string;
  emoji?: string | null;
  sortOrder: number;
  isActive?: boolean;
}) {
  try {
    return await prisma.weeklyMenuEntry.create({ data });
  } catch (err) {
    if (!isMissingMenuDateColumn(err)) throw err;
    const { menuDate: _ignored, ...rest } = data;
    return prisma.weeklyMenuEntry.create({ data: rest });
  }
}

export async function updateWeeklyMenuEntrySafe(
  id: string,
  data: {
    dayLabel?: string;
    menuDate?: string | null;
    menuText?: string;
    emoji?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  try {
    return await prisma.weeklyMenuEntry.update({ where: { id }, data });
  } catch (err) {
    if (!isMissingMenuDateColumn(err)) throw err;
    const { menuDate: _ignored, ...rest } = data;
    return prisma.weeklyMenuEntry.update({ where: { id }, data: rest });
  }
}

export async function probeMenuDateColumn(): Promise<boolean> {
  try {
    await prisma.weeklyMenuEntry.findFirst({ select: { menuDate: true } });
    return true;
  } catch {
    return false;
  }
}
