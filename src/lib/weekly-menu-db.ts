import "server-only";

import type { MenuCategoryType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isSchoolWeekDay,
  resolveOperationalMenuDate,
} from "@/lib/week-days";

export type WeeklyMenuRowSelect = {
  id: string;
  category: MenuCategoryType;
  dayLabel: string;
  menuDate: string | null;
  menuText: string;
  description: string | null;
  imageUrl: string | null;
  emoji: string | null;
  sortOrder: number;
  isActive: boolean;
};

function isMissingColumn(err: unknown, column: string): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes(column) &&
    (msg.includes("Unknown column") ||
      msg.includes("does not exist") ||
      msg.includes("Unknown arg") ||
      msg.includes("Unknown field") ||
      msg.includes("column") ||
      msg.includes("Available options"))
  );
}

function isMissingMenuDateColumn(err: unknown): boolean {
  return isMissingColumn(err, "menuDate");
}

function isMissingMediaColumn(err: unknown): boolean {
  return isMissingColumn(err, "description") || isMissingColumn(err, "imageUrl");
}

const FULL_SELECT = {
  id: true,
  category: true,
  dayLabel: true,
  menuDate: true,
  menuText: true,
  description: true,
  imageUrl: true,
  emoji: true,
  sortOrder: true,
  isActive: true,
} as const;

const NO_MEDIA_SELECT = {
  id: true,
  category: true,
  dayLabel: true,
  menuDate: true,
  menuText: true,
  emoji: true,
  sortOrder: true,
  isActive: true,
} as const;

const BASE_SELECT = {
  id: true,
  category: true,
  dayLabel: true,
  menuText: true,
  emoji: true,
  sortOrder: true,
  isActive: true,
} as const;

function withDefaults(
  row: {
    id: string;
    category: MenuCategoryType;
    dayLabel: string;
    menuDate?: string | null;
    menuText: string;
    description?: string | null;
    imageUrl?: string | null;
    emoji: string | null;
    sortOrder: number;
    isActive: boolean;
  }
): WeeklyMenuRowSelect {
  return {
    id: row.id,
    category: row.category,
    dayLabel: row.dayLabel,
    menuDate: row.menuDate ?? null,
    menuText: row.menuText,
    description: row.description ?? null,
    imageUrl: row.imageUrl ?? null,
    emoji: row.emoji,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

/**
 * Baca WeeklyMenuEntry dengan kolom baru bila sudah ada di DB.
 * Fallback bertingkat agar deploy tidak crash sebelum `db:deploy`.
 */
export async function findWeeklyMenuEntries(
  where: Prisma.WeeklyMenuEntryWhereInput
): Promise<WeeklyMenuRowSelect[]> {
  try {
    const rows = await prisma.weeklyMenuEntry.findMany({
      where,
      select: FULL_SELECT,
    });
    return rows.map(withDefaults);
  } catch (err) {
    if (isMissingMediaColumn(err)) {
      try {
        const rows = await prisma.weeklyMenuEntry.findMany({
          where,
          select: NO_MEDIA_SELECT,
        });
        return rows.map(withDefaults);
      } catch (inner) {
        if (!isMissingMenuDateColumn(inner)) throw inner;
      }
    } else if (!isMissingMenuDateColumn(err)) {
      throw err;
    }

    const rows = await prisma.weeklyMenuEntry.findMany({
      where,
      select: BASE_SELECT,
    });
    return rows.map(withDefaults);
  }
}

export async function createWeeklyMenuEntrySafe(data: {
  category: MenuCategoryType;
  dayLabel: string;
  menuDate?: string | null;
  menuText: string;
  description?: string | null;
  imageUrl?: string | null;
  emoji?: string | null;
  sortOrder: number;
  isActive?: boolean;
}) {
  try {
    return await prisma.weeklyMenuEntry.create({ data });
  } catch (err) {
    if (isMissingMediaColumn(err)) {
      const { description: _d, imageUrl: _i, ...rest } = data;
      try {
        return await prisma.weeklyMenuEntry.create({ data: rest });
      } catch (inner) {
        if (!isMissingMenuDateColumn(inner)) throw inner;
        const { menuDate: _m, ...base } = rest;
        return prisma.weeklyMenuEntry.create({ data: base });
      }
    }
    if (!isMissingMenuDateColumn(err)) throw err;
    const { menuDate: _ignored, description: _d, imageUrl: _i, ...rest } = data;
    return prisma.weeklyMenuEntry.create({ data: rest });
  }
}

export async function updateWeeklyMenuEntrySafe(
  id: string,
  data: {
    dayLabel?: string;
    menuDate?: string | null;
    menuText?: string;
    description?: string | null;
    imageUrl?: string | null;
    emoji?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  try {
    return await prisma.weeklyMenuEntry.update({ where: { id }, data });
  } catch (err) {
    if (isMissingMediaColumn(err)) {
      const { description: _d, imageUrl: _i, ...rest } = data;
      try {
        return await prisma.weeklyMenuEntry.update({ where: { id }, data: rest });
      } catch (inner) {
        if (!isMissingMenuDateColumn(inner)) throw inner;
        const { menuDate: _m, ...base } = rest;
        return prisma.weeklyMenuEntry.update({ where: { id }, data: base });
      }
    }
    if (!isMissingMenuDateColumn(err)) throw err;
    const { menuDate: _ignored, description: _d, imageUrl: _i, ...rest } = data;
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

/**
 * Perbaiki menuDate yang drift di luar minggu operasional
 * (mis. Senin 7 Sep saat operasional Senin 14 Sep).
 */
export async function healWeeklyMenuDatesForCategory(
  category: MenuCategoryType,
  ref = new Date()
): Promise<WeeklyMenuRowSelect[]> {
  const rows = await findWeeklyMenuEntries({ category });
  const healed: WeeklyMenuRowSelect[] = [];
  for (const row of rows) {
    if (!isSchoolWeekDay(row.dayLabel)) {
      healed.push(row);
      continue;
    }
    const nextDate = resolveOperationalMenuDate(row.dayLabel, row.menuDate, ref);
    if (row.menuDate === nextDate) {
      healed.push(row);
      continue;
    }
    await updateWeeklyMenuEntrySafe(row.id, { menuDate: nextDate });
    healed.push({ ...row, menuDate: nextDate });
  }
  return healed;
}
