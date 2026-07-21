import "server-only";

import { addDays, format, startOfWeek } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { MenuCategoryType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MENU_ICON } from "@/lib/menu-icons";
import {
  MENU_CATEGORY_ID_TO_TYPE,
  type MenuCategoryId,
  type MenuCategoryTypeId,
} from "@/lib/menu-meta";
import { toMenuCategoryType } from "@/lib/menu-meta.server";
import { syncMenuItemFromWeekly } from "@/lib/menu-sync";
import { sortOrderForDay, WEEK_DAYS } from "@/lib/week-days";
import { revalidatePublicContent } from "@/lib/revalidate-public";

/** Inventory Food Production kategori → portal MenuCategoryType. */
const INV_KATEGORI_TO_PORTAL: Record<string, MenuCategoryTypeId> = {
  PORSI_KECIL: "PORSI_KECIL",
  PORSI_BESAR: "PORSI_BESAR",
  POSYANDU_BUMIL_BUSUI: "IBU_HAMIL",
  POSYANDU_BALITA: "BALITA",
};

const SKIP_PLAN_STATUS = new Set(["DRAFT", "CANCELLED"]);

type InvPlanLine = {
  menuId?: string;
  menuKode?: string;
  menuNama?: string;
  kategoriPorsiList?: string[];
  targetPorsi?: number;
};

type InvPlan = {
  id?: string;
  tanggal?: string;
  status?: string;
  kitchenId?: string;
  kitchenNama?: string;
  lines?: InvPlanLine[];
  kategoriPorsiList?: string[];
};

export type SyncWeeklyMenuResult = {
  categoryId: MenuCategoryId;
  from: string;
  to: string;
  daysWritten: number;
  menusTouched: number;
  plansSeen: number;
  skippedStatus: number;
  message: string;
};

function requireInventoryConfig() {
  const base = (process.env.INVENTORY_APP_URL || process.env.INVENTORY_API_URL || "").replace(
    /\/$/,
    ""
  );
  const apiKey = process.env.INVENTORY_API_KEY || "";
  if (!base || !apiKey) {
    throw new Error(
      "INVENTORY_APP_URL dan INVENTORY_API_KEY belum di-set di environment portal"
    );
  }
  return { base, apiKey };
}

/** Senin–Minggu minggu berjalan menurut kalender Asia/Jakarta. */
export function currentWeekRange(ref = new Date()): { from: string; to: string } {
  const jakartaDate = formatInJakarta(ref);
  const monday = startOfWeek(jakartaDate, { weekStartsOn: 1 });
  const sunday = addDays(monday, 6);
  return {
    from: format(monday, "yyyy-MM-dd"),
    to: format(sunday, "yyyy-MM-dd"),
  };
}

/** Ambil Y-M-D “hari ini” di Jakarta lalu parse ke Date lokal noon. */
function formatInJakarta(ref: Date): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ref);
  return new Date(`${ymd}T12:00:00`);
}

function dayLabelFromTanggal(tanggal: string): string | null {
  const d = new Date(`${tanggal}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const raw = format(d, "EEEE", { locale: localeId });
  const label = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const match = WEEK_DAYS.find((w) => w.toLowerCase() === label.toLowerCase());
  return match ?? null;
}

function kategoriListMatches(list: string[] | undefined, portalType: MenuCategoryTypeId): boolean {
  return (list || []).some((kp) => INV_KATEGORI_TO_PORTAL[kp] === portalType);
}

/** Baris cocok jika kategori baris match; atau (tanpa kategori baris) kategori dokumen match. */
function lineMatchesCategory(
  line: InvPlanLine,
  plan: InvPlan,
  portalType: MenuCategoryTypeId
): boolean {
  const lineList = line.kategoriPorsiList || [];
  if (lineList.length > 0) return kategoriListMatches(lineList, portalType);
  return kategoriListMatches(plan.kategoriPorsiList, portalType);
}

async function fetchProductionPlans(from: string, to: string): Promise<InvPlan[]> {
  const { base, apiKey } = requireInventoryConfig();
  const kitchenId = process.env.INVENTORY_KITCHEN_ID?.trim();
  const url = new URL(`${base}/api/fp-public/plans`);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  if (kitchenId) url.searchParams.set("kitchenId", kitchenId);

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Inventory plans HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("Respons inventory /fp-public/plans bukan array");
  }
  return data as InvPlan[];
}

/**
 * Timpa WeeklyMenuEntry untuk satu kategori dari Rencana Produksi minggu ini.
 * Hari tanpa data inventory → entri kategori dihapus (jadwal bersih).
 */
export async function syncWeeklyMenuFromInventory(
  categoryId: MenuCategoryId,
  options?: { from?: string; to?: string }
): Promise<SyncWeeklyMenuResult> {
  const range = {
    from: options?.from || currentWeekRange().from,
    to: options?.to || currentWeekRange().to,
  };
  const portalType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  const category = toMenuCategoryType(categoryId);

  const plans = await fetchProductionPlans(range.from, range.to);
  let skippedStatus = 0;

  /** dayLabel → unique menu names (order preserved) */
  const byDay = new Map<string, string[]>();

  for (const plan of plans) {
    const status = String(plan.status || "").toUpperCase();
    if (SKIP_PLAN_STATUS.has(status)) {
      skippedStatus += 1;
      continue;
    }
    if (!plan.tanggal) continue;

    const dayLabel = dayLabelFromTanggal(plan.tanggal);
    if (!dayLabel) continue;

    const resolvedNames: string[] = [];
    for (const line of plan.lines || []) {
      if (!lineMatchesCategory(line, plan, portalType)) continue;
      const nama = String(line.menuNama || line.menuKode || "").trim();
      if (nama) resolvedNames.push(nama);
    }
    if (!resolvedNames.length) continue;

    const existing = byDay.get(dayLabel) || [];
    for (const n of resolvedNames) {
      if (!existing.some((x) => x.toLowerCase() === n.toLowerCase())) existing.push(n);
    }
    byDay.set(dayLabel, existing);
  }

  await prisma.weeklyMenuEntry.deleteMany({ where: { category } });

  let daysWritten = 0;
  let menusTouched = 0;

  for (const dayLabel of WEEK_DAYS) {
    const menus = byDay.get(dayLabel);
    if (!menus?.length) continue;
    const menuText = menus.join(" · ");
    await prisma.weeklyMenuEntry.create({
      data: {
        category: category as MenuCategoryType,
        dayLabel,
        menuText,
        emoji: DEFAULT_MENU_ICON,
        sortOrder: sortOrderForDay(dayLabel),
        isActive: true,
      },
    });
    daysWritten += 1;
    for (const nama of menus) {
      await syncMenuItemFromWeekly(category as MenuCategoryType, nama, DEFAULT_MENU_ICON);
      menusTouched += 1;
    }
  }

  revalidatePublicContent({ menu: true });

  return {
    categoryId,
    from: range.from,
    to: range.to,
    daysWritten,
    menusTouched,
    plansSeen: plans.length,
    skippedStatus,
    message:
      daysWritten > 0
        ? `Sinkron ${daysWritten} hari dari rencana produksi (${range.from} – ${range.to})`
        : `Tidak ada rencana produksi cocok untuk kategori ini (${range.from} – ${range.to})`,
  };
}

export async function syncAllWeeklyMenusFromInventory(options?: {
  from?: string;
  to?: string;
}): Promise<SyncWeeklyMenuResult[]> {
  const ids = Object.keys(MENU_CATEGORY_ID_TO_TYPE) as MenuCategoryId[];
  const results: SyncWeeklyMenuResult[] = [];
  for (const categoryId of ids) {
    results.push(await syncWeeklyMenuFromInventory(categoryId, options));
  }
  return results;
}
