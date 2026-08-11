import "server-only";

import { prisma } from "@/lib/prisma";
import { ORGANOLEPTIC_ITEMS_PER_PACKAGE } from "@/lib/organoleptic-meta";

export const ORGANOLEPTIC_FOOD_TEMPLATE_ID = "default";

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

export async function getOrganolepticFoodTemplateNames(): Promise<string[]> {
  try {
    const row = await prisma.organolepticFoodTemplate.findUnique({
      where: { id: ORGANOLEPTIC_FOOD_TEMPLATE_ID },
      select: { foodNames: true },
    });
    return normalizeFoodTemplateNames(row?.foodNames ?? []);
  } catch (err) {
    console.error("[organoleptic-food-template] get failed:", err);
    return normalizeFoodTemplateNames([]);
  }
}

export async function saveOrganolepticFoodTemplateNames(
  foodNames: string[]
): Promise<string[]> {
  const normalized = normalizeFoodTemplateNames(foodNames);
  // Simpan tanpa trailing kosong berlebih di DB, tapi API selalu pad ke 5 saat baca
  const toStore = normalized.map((n) => n.trim());

  await prisma.organolepticFoodTemplate.upsert({
    where: { id: ORGANOLEPTIC_FOOD_TEMPLATE_ID },
    create: {
      id: ORGANOLEPTIC_FOOD_TEMPLATE_ID,
      foodNames: toStore,
    },
    update: {
      foodNames: toStore,
    },
  });

  return normalized;
}
