import "server-only";

import { prisma } from "@/lib/prisma";
import {
  ORGANOLEPTIC_ITEMS_PER_PACKAGE,
  formatInspectionDateInput,
  parseInspectionDate,
} from "@/lib/organoleptic-meta";

export function normalizeFoodTemplateNames(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : [];
  const names = list
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .slice(0, ORGANOLEPTIC_ITEMS_PER_PACKAGE);

  while (names.length < ORGANOLEPTIC_ITEMS_PER_PACKAGE) {
    names.push("");
  }

  return names;
}

export function resolveTemplateMenuDate(dateStr?: string | null): Date | null {
  if (dateStr?.trim()) {
    return parseInspectionDate(dateStr.trim());
  }
  return parseInspectionDate(formatInspectionDateInput(new Date()));
}

export async function getOrganolepticFoodTemplateNames(
  dateStr?: string | null
): Promise<string[]> {
  const menuDate = resolveTemplateMenuDate(dateStr);
  if (!menuDate) return normalizeFoodTemplateNames([]);

  try {
    const row = await prisma.organolepticFoodTemplate.findUnique({
      where: { menuDate },
      select: { foodNames: true },
    });
    return normalizeFoodTemplateNames(row?.foodNames ?? []);
  } catch (err) {
    console.error("[organoleptic-food-template] get failed:", err);
    return normalizeFoodTemplateNames([]);
  }
}

export async function saveOrganolepticFoodTemplateNames(
  dateStr: string,
  foodNames: string[]
): Promise<{ menuDate: string; foodNames: string[] }> {
  const menuDate = parseInspectionDate(dateStr);
  if (!menuDate) {
    throw new Error("Tanggal template tidak valid (YYYY-MM-DD)");
  }

  const normalized = normalizeFoodTemplateNames(foodNames);
  const toStore = normalized.map((n) => n.trim());

  await prisma.organolepticFoodTemplate.upsert({
    where: { menuDate },
    create: {
      menuDate,
      foodNames: toStore,
    },
    update: {
      foodNames: toStore,
    },
  });

  return {
    menuDate: formatInspectionDateInput(menuDate),
    foodNames: normalized,
  };
}

export async function listRecentOrganolepticFoodTemplates(limit = 14) {
  try {
    const rows = await prisma.organolepticFoodTemplate.findMany({
      orderBy: { menuDate: "desc" },
      take: limit,
      select: { menuDate: true, foodNames: true, updatedAt: true },
    });
    return rows.map((row) => ({
      menuDate: formatInspectionDateInput(row.menuDate),
      foodNames: normalizeFoodTemplateNames(row.foodNames),
      updatedAt: row.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("[organoleptic-food-template] list failed:", err);
    return [];
  }
}
