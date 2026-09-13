import { NextResponse } from "next/server";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { MENU_CATEGORY_ID_TO_TYPE, type MenuCategoryId } from "@/lib/menu-meta";
import { toMenuCategoryType } from "@/lib/menu-meta.server";
import { syncMenuItemFromWeekly } from "@/lib/menu-sync";
import { normalizeMenuIcon } from "@/lib/menu-icons";
import {
  dateForDayLabelInOperationalWeek,
  isSchoolWeekDay,
  isWeeklyEntryInOperationalWeek,
  sortOrderForDay,
} from "@/lib/week-days";
import {
  createWeeklyMenuEntrySafe,
  healWeeklyMenuDatesForCategory,
} from "@/lib/weekly-menu-db";

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
    const categoryType = toMenuCategoryType(categoryId);
    const healed = await healWeeklyMenuDatesForCategory(categoryType);
    const entries = healed.filter((e) => isWeeklyEntryInOperationalWeek(e));
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
    const { categoryId, dayLabel, menuText, emoji, isActive, description, imageUrl } = body as {
      categoryId?: string;
      dayLabel?: string;
      menuText?: string;
      emoji?: string;
      isActive?: boolean;
      description?: string | null;
      imageUrl?: string | null;
    };

    const catId = parseCategoryId(categoryId ?? null);
    if (!catId || !dayLabel?.trim() || !menuText?.trim()) {
      return badRequest("Kategori, hari, dan menu wajib diisi");
    }

    const trimmedDay = dayLabel.trim();
    if (!isSchoolWeekDay(trimmedDay)) {
      return badRequest("Hari harus Senin–Jumat (hari sekolah)");
    }

    const categoryType = toMenuCategoryType(catId);
    const trimmedMenu = menuText.trim();
    const menuEmoji = normalizeMenuIcon(emoji);
    const trimmedDescription =
      typeof description === "string" ? description.trim() || null : null;
    const trimmedImageUrl =
      typeof imageUrl === "string" ? imageUrl.trim() || null : imageUrl === null ? null : undefined;

    const entry = await createWeeklyMenuEntrySafe({
      category: categoryType,
      dayLabel: trimmedDay,
      menuDate: dateForDayLabelInOperationalWeek(trimmedDay),
      menuText: trimmedMenu,
      description: trimmedDescription,
      imageUrl: trimmedImageUrl ?? null,
      emoji: menuEmoji,
      sortOrder: sortOrderForDay(trimmedDay),
      isActive: isActive !== false,
    });

    await syncMenuItemFromWeekly(categoryType, trimmedMenu, menuEmoji);
    revalidatePublicContent({ menu: true });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return serverError("Gagal menambah jadwal menu");
  }
}
