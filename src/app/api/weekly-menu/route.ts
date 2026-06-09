import { NextResponse } from "next/server";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { MENU_CATEGORY_ID_TO_TYPE, type MenuCategoryId } from "@/lib/menu-meta";
import { prisma } from "@/lib/prisma";
import { syncMenuItemFromWeekly } from "@/lib/menu-sync";
import { normalizeMenuIcon } from "@/lib/menu-icons";
import { sortOrderForDay } from "@/lib/week-days";

const validCategoryIds = new Set<string>(Object.keys(MENU_CATEGORY_ID_TO_TYPE));

function parseCategoryId(value: string | null): MenuCategoryId | null {
  if (!value || !validCategoryIds.has(value)) return null;
  return value as MenuCategoryId;
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const categoryId = parseCategoryId(new URL(request.url).searchParams.get("category"));
  if (!categoryId) return badRequest("Parameter category wajib diisi");

  try {
    const entries = await prisma.weeklyMenuEntry.findMany({
      where: { category: MENU_CATEGORY_ID_TO_TYPE[categoryId] },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(entries);
  } catch {
    return serverError("Gagal memuat jadwal menu");
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { categoryId, dayLabel, menuText, emoji, isActive } = body as {
      categoryId?: string;
      dayLabel?: string;
      menuText?: string;
      emoji?: string;
      isActive?: boolean;
    };

    const catId = parseCategoryId(categoryId ?? null);
    if (!catId || !dayLabel?.trim() || !menuText?.trim()) {
      return badRequest("Kategori, hari, dan menu wajib diisi");
    }

    const trimmedDay = dayLabel.trim();

    const categoryType = MENU_CATEGORY_ID_TO_TYPE[catId];
    const trimmedMenu = menuText.trim();
    const menuEmoji = normalizeMenuIcon(emoji);

    const entry = await prisma.weeklyMenuEntry.create({
      data: {
        category: categoryType,
        dayLabel: trimmedDay,
        menuText: trimmedMenu,
        emoji: menuEmoji,
        sortOrder: sortOrderForDay(trimmedDay),
        isActive: isActive !== false,
      },
    });

    await syncMenuItemFromWeekly(categoryType, trimmedMenu, menuEmoji);
    revalidatePublicContent({ menu: true });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return serverError("Gagal menambah jadwal menu");
  }
}
