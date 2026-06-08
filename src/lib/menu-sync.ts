import { MenuCategoryType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MENU_ICON, normalizeMenuIcon } from "@/lib/menu-icons";
import { MENU_CATEGORY_ID_TO_TYPE, type MenuCategoryId } from "@/lib/menu-meta";

export async function syncMenuItemFromWeekly(
  category: MenuCategoryType,
  menuText: string,
  emoji?: string | null
) {
  const name = menuText.trim();
  if (!name) return null;

  const icon = normalizeMenuIcon(emoji);

  const existing = await prisma.menuItem.findFirst({
    where: {
      category,
      name: { equals: name, mode: "insensitive" },
    },
  });

  if (existing) {
    return prisma.menuItem.update({
      where: { id: existing.id },
      data: { isActive: true, emoji: icon },
    });
  }

  return prisma.menuItem.create({
    data: {
      category,
      name,
      description: "Menu pernah tersedia di jadwal mingguan",
      emoji: icon,
      votes: 0,
      isActive: true,
    },
  });
}

export async function syncMenuItemsForCategory(categoryId: MenuCategoryId) {
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  const entries = await prisma.weeklyMenuEntry.findMany({
    where: { category: categoryType },
    select: { menuText: true, emoji: true },
  });

  const seen = new Set<string>();
  for (const entry of entries) {
    const key = entry.menuText.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    await syncMenuItemFromWeekly(categoryType, entry.menuText, entry.emoji ?? DEFAULT_MENU_ICON);
  }
}
