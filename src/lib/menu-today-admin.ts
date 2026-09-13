import "server-only";

import { MENU_CATEGORIES, type MenuCategoryId } from "@/lib/menu-meta";
import { toMenuCategoryType } from "@/lib/menu-meta.server";
import { DEFAULT_MENU_ICON, normalizeMenuIcon } from "@/lib/menu-icons";
import { syncMenuItemFromWeekly } from "@/lib/menu-sync";
import type { TodayMenuAdminSnapshot, TodayMenuCategorySnapshot } from "@/lib/types";
import {
  createWeeklyMenuEntrySafe,
  healWeeklyMenuDatesForCategory,
  updateWeeklyMenuEntrySafe,
  type WeeklyMenuRowSelect,
} from "@/lib/weekly-menu-db";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { getInventoryMenuTextForDate } from "@/lib/inventory-weekly-menu-sync";
import {
  jakartaSchoolMenuTarget,
  resolveOperationalMenuDate,
  sortOrderForDay,
} from "@/lib/week-days";

export type { TodayMenuAdminSnapshot, TodayMenuCategorySnapshot };

/**
 * Cari entri sasaran Menu Hari Ini.
 * Prioritas: tanggal target → dayLabel yang sama (agar Senin sync 14 Sep
 * tetap ketemu di akhir pekan, bukan membuat baris baru dengan tanggal salah).
 */
function pickTargetEntry(
  rows: WeeklyMenuRowSelect[],
  targetYmd: string,
  dayLabel: string
) {
  const label = dayLabel.trim().toLowerCase();
  return (
    rows.find((r) => r.menuDate === targetYmd) ??
    rows.find((r) => r.dayLabel.trim().toLowerCase() === label) ??
    null
  );
}

function pickInventoryDefault(
  categories: TodayMenuCategorySnapshot[]
): TodayMenuAdminSnapshot["inventoryDefault"] {
  // Baseline sync: nama dari jadwal; deskripsi/foto admin tidak dianggap default Inventory.
  const withName =
    categories.find((c) => c.entry?.menuText.trim()) ?? null;
  if (!withName?.entry?.menuText.trim()) return null;
  return {
    menuText: withName.entry.menuText,
    description: null,
    imageUrl: null,
    menuDate: withName.entry.menuDate,
    dayLabel: withName.entry.dayLabel,
    categoryId: withName.categoryId,
  };
}

export async function getTodayMenuAdminSnapshot(
  ref = new Date()
): Promise<TodayMenuAdminSnapshot> {
  const target = jakartaSchoolMenuTarget(ref);
  const todayYmd = target.ymd;
  const dayLabel = target.dayLabel;

  const categories: TodayMenuCategorySnapshot[] = [];
  for (const cat of MENU_CATEGORIES) {
    const rows = await healWeeklyMenuDatesForCategory(
      toMenuCategoryType(cat.id),
      ref
    );
    const entry = pickTargetEntry(rows, todayYmd, dayLabel);
    categories.push({
      categoryId: cat.id,
      label: cat.label,
      emoji: cat.emoji,
      entry: entry
        ? {
            id: entry.id,
            menuText: entry.menuText,
            description: entry.description,
            imageUrl: entry.imageUrl,
            emoji: entry.emoji,
            menuDate: entry.menuDate,
            dayLabel: entry.dayLabel,
            isActive: entry.isActive,
          }
        : null,
    });
  }

  return {
    todayYmd,
    dayLabel,
    isWeekendFallback: target.isWeekendFallback,
    inventoryDefault: pickInventoryDefault(categories),
    categories,
  };
}

export async function upsertTodayMenuForCategories(input: {
  menuText: string;
  description?: string | null;
  imageUrl?: string | null;
  emoji?: string | null;
  categoryIds: MenuCategoryId[];
  ref?: Date;
}): Promise<TodayMenuAdminSnapshot> {
  const ref = input.ref ?? new Date();
  const target = jakartaSchoolMenuTarget(ref);
  const dayLabel = target.dayLabel;
  const menuText = input.menuText.trim();
  if (!menuText) throw new Error("Nama menu wajib diisi");

  const description =
    typeof input.description === "string"
      ? input.description.trim() || null
      : input.description === null
        ? null
        : undefined;
  const imageUrl =
    typeof input.imageUrl === "string"
      ? input.imageUrl.trim() || null
      : input.imageUrl === null
        ? null
        : undefined;
  const emoji = normalizeMenuIcon(input.emoji ?? DEFAULT_MENU_ICON);

  const validIds = new Set(MENU_CATEGORIES.map((c) => c.id));
  const categoryIds = input.categoryIds.filter((id) => validIds.has(id));
  if (categoryIds.length === 0) {
    throw new Error("Pilih minimal satu kategori");
  }

  for (const categoryId of categoryIds) {
    const category = toMenuCategoryType(categoryId);
    const rows = await healWeeklyMenuDatesForCategory(category, ref);
    const existing = pickTargetEntry(rows, target.ymd, dayLabel);
    // Jangan timpa tanggal sync Inventory (14 Sep) dengan Senin minggu kalender (7 Sep).
    const menuDate = resolveOperationalMenuDate(
      dayLabel,
      existing?.menuDate ?? target.ymd,
      ref
    );

    if (existing) {
      const nextDescription =
        description !== undefined ? description : existing.description;
      const nextImageUrl = imageUrl !== undefined ? imageUrl : existing.imageUrl;
      await updateWeeklyMenuEntrySafe(existing.id, {
        dayLabel,
        menuDate,
        menuText,
        description: nextDescription,
        imageUrl: nextImageUrl,
        emoji,
        sortOrder: sortOrderForDay(dayLabel),
        isActive: true,
      });
      await syncMenuItemFromWeekly(category, menuText, emoji);
    } else {
      await createWeeklyMenuEntrySafe({
        category,
        dayLabel,
        menuDate,
        menuText,
        description: description ?? null,
        imageUrl: imageUrl ?? null,
        emoji,
        sortOrder: sortOrderForDay(dayLabel),
        isActive: true,
      });
      await syncMenuItemFromWeekly(category, menuText, emoji);
    }
  }

  revalidatePublicContent({ menu: true });
  return getTodayMenuAdminSnapshot(ref);
}

/**
 * Kebalikan Simpan Menu Hari Ini:
 * - nama ← Rencana Produksi Inventory (tanggal sasaran)
 * - deskripsi & foto dikosongkan
 */
export async function resetTodayMenuForCategories(input: {
  categoryIds: MenuCategoryId[];
  ref?: Date;
}): Promise<TodayMenuAdminSnapshot> {
  const ref = input.ref ?? new Date();
  const target = jakartaSchoolMenuTarget(ref);
  const dayLabel = target.dayLabel;
  const emoji = DEFAULT_MENU_ICON;

  const validIds = new Set(MENU_CATEGORIES.map((c) => c.id));
  const categoryIds = input.categoryIds.filter((id) => validIds.has(id));
  if (categoryIds.length === 0) {
    throw new Error("Pilih minimal satu kategori");
  }

  for (const categoryId of categoryIds) {
    const category = toMenuCategoryType(categoryId);
    const rows = await healWeeklyMenuDatesForCategory(category, ref);
    const existing = pickTargetEntry(rows, target.ymd, dayLabel);
    let inventoryName: string | null = null;
    try {
      inventoryName = await getInventoryMenuTextForDate(categoryId, target.ymd);
    } catch (err) {
      // Inventory down → tetap hapus deskripsi/foto; nama pakai yang ada di jadwal.
      console.error("[resetTodayMenu] inventory lookup", categoryId, err);
    }
    const menuText = (inventoryName || existing?.menuText || "").trim();
    if (!menuText) {
      throw new Error(
        "Tidak ada nama menu Inventory untuk tanggal ini. Sync Inventory dulu."
      );
    }

    const menuDate = resolveOperationalMenuDate(
      dayLabel,
      existing?.menuDate ?? target.ymd,
      ref
    );

    if (existing) {
      await updateWeeklyMenuEntrySafe(existing.id, {
        dayLabel,
        menuDate,
        menuText,
        description: null,
        imageUrl: null,
        emoji,
        sortOrder: sortOrderForDay(dayLabel),
        isActive: true,
      });
    } else {
      await createWeeklyMenuEntrySafe({
        category,
        dayLabel,
        menuDate,
        menuText,
        description: null,
        imageUrl: null,
        emoji,
        sortOrder: sortOrderForDay(dayLabel),
        isActive: true,
      });
    }
    await syncMenuItemFromWeekly(category, menuText, emoji);
  }

  revalidatePublicContent({ menu: true });
  return getTodayMenuAdminSnapshot(ref);
}
