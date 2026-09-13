import "server-only";

import { format } from "date-fns";
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
import {
  operationalWeekRange,
  sortOrderForDay,
  WEEK_DAYS,
} from "@/lib/week-days";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { createWeeklyMenuEntrySafe, findWeeklyMenuEntries, updateWeeklyMenuEntrySafe } from "@/lib/weekly-menu-db";

/** Inventory Food Production kategori → portal MenuCategoryType. */
const INV_KATEGORI_TO_PORTAL: Record<string, MenuCategoryTypeId> = {
  PORSI_KECIL: "PORSI_KECIL",
  PORSI_BESAR: "PORSI_BESAR",
  POSYANDU_BUMIL_BUSUI: "IBU_HAMIL",
  POSYANDU_BALITA: "BALITA",
};

/** Hanya rencana yang sudah “terkunci” operasional untuk publik. */
const SYNCABLE_PLAN_STATUS = new Set([
  "APPROVED",
  "PROCESSING",
  "COMPLETED",
  // Label UI Inventory (jika API mengirim teks tampilan)
  "DISETUJUI",
  "DIPROSES",
  "SELESAI",
]);

function normalizePlanStatus(status: string | undefined): string {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

type InvPlanLine = {
  recipeId?: string;
  recipeKode?: string;
  recipeNama?: string;
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
  menusPruned: number;
  plansSeen: number;
  plansUsed: number;
  skippedStatus: number;
  message: string;
};

function requireInventoryConfig() {
  const base = (
    process.env.INVENTORY_APP_URL ||
    process.env.INVENTORY_API_URL ||
    process.env.PORTAL_INVENTORY_APP_URL ||
    ""
  )
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/$/, "");
  const apiKey = (
    process.env.INVENTORY_API_KEY ||
    process.env.PORTAL_INVENTORY_API_KEY ||
    ""
  )
    .trim()
    .replace(/^["']|["']$/g, "");

  const isPlaceholder = (v: string) =>
    !v || v === "[SENSITIVE]" || /^sk_\.\.\./i.test(v);

  if (isPlaceholder(base) || isPlaceholder(apiKey)) {
    throw new Error(
      "Sync Inventory tidak jalan di npm run dev lokal (INVENTORY_APP_URL / INVENTORY_API_KEY kosong). " +
        "Tanpa buat key baru: (1) sync dari admin website live — env Vercel sudah terpasang di production; " +
        "atau (2) jalankan npm run env:inventory; " +
        "atau (3) tempel key yang sama ke .env.local lalu restart npm run dev."
    );
  }
  return { base, apiKey };
}

/**
 * Senin–Jumat minggu sync (Asia/Jakarta), sesuai aturan produk:
 * - Senin–Jumat → Senin–Jumat minggu yang sama
 * - Sabtu–Minggu → Senin–Jumat minggu depan
 *
 * Contoh Kamis 11 Sep → 7–11 Sep.
 * Contoh Minggu 13 Sep → 14–18 Sep.
 */
export function currentWeekRange(ref = new Date()): { from: string; to: string } {
  return operationalWeekRange(ref);
}

/** Default sync = currentWeekRange (Sen–Jum minggu ini; Sab–Min minggu depan). */
export function defaultSyncRange(ref = new Date()): { from: string; to: string } {
  return currentWeekRange(ref);
}

/** Normalisasi tanggal Inventory ke YYYY-MM-DD. */
function normalizePlanTanggal(tanggal: string): string | null {
  const raw = tanggal.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const prefix = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return prefix;
  return null;
}

function dayLabelFromTanggal(tanggal: string): string | null {
  const d = new Date(`${tanggal}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const raw = format(d, "EEEE", { locale: localeId });
  const label = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const match = WEEK_DAYS.find((w) => w.toLowerCase() === label.toLowerCase());
  return match ?? null;
}

/** Sama urutan preferensi Inventory: recipe* dulu, lalu menu* legacy. */
function resolveLineName(line: InvPlanLine): string {
  return String(
    line.recipeNama || line.recipeKode || line.menuNama || line.menuKode || ""
  ).trim();
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
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Inventory menolak API key (HTTP ${res.status}). Buat key baru di Inventory → Utiliti → API Keys dengan scope food-production:read, lalu set INVENTORY_API_KEY di .env portal dan restart npm run dev.`
      );
    }
    throw new Error(`Inventory plans HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("Respons inventory /fp-public/plans bukan array");
  }
  return data as InvPlan[];
}

/**
 * Nama menu gabungan dari Rencana Produksi Inventory untuk 1 tanggal + kategori.
 * Dipakai Reset Menu Hari Ini (kebalikan Simpan admin).
 */
export async function getInventoryMenuTextForDate(
  categoryId: MenuCategoryId,
  ymd: string
): Promise<string | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const portalType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  const plans = await fetchProductionPlans(ymd, ymd);
  const menus: string[] = [];

  for (const plan of plans) {
    const status = normalizePlanStatus(plan.status);
    if (!SYNCABLE_PLAN_STATUS.has(status)) continue;
    const menuDate = plan.tanggal ? normalizePlanTanggal(plan.tanggal) : null;
    if (menuDate !== ymd) continue;
    for (const line of plan.lines || []) {
      if (!lineMatchesCategory(line, plan, portalType)) continue;
      const nama = resolveLineName(line);
      if (!nama) continue;
      if (!menus.some((x) => x.toLowerCase() === nama.toLowerCase())) {
        menus.push(nama);
      }
    }
  }

  return menus.length ? menus.join(" · ") : null;
}

/**
 * Nonaktifkan MenuItem kategori yang tidak muncul di sync terbaru
 * (membersihkan sisa seed/mock agar favorit tidak menipu).
 */
async function pruneOrphanMenuItems(
  category: MenuCategoryType,
  keepNames: Set<string>
): Promise<number> {
  const active = await prisma.menuItem.findMany({
    where: { category, isActive: true },
    select: { id: true, name: true },
  });
  const orphanIds = active
    .filter((item) => {
      const name = item.name.trim();
      // Nama gabungan "A · B" bukan item favorit yang valid
      if (name.includes(" · ")) return true;
      return !keepNames.has(name.toLowerCase());
    })
    .map((item) => item.id);
  if (orphanIds.length === 0) return 0;
  await prisma.menuItem.updateMany({
    where: { id: { in: orphanIds } },
    data: { isActive: false },
  });
  return orphanIds.length;
}

/**
 * Timpa WeeklyMenuEntry untuk satu kategori dari Rencana Produksi.
 * Rentang default: Senin–Jumat minggu sync (lihat currentWeekRange).
 * Hari tanpa data inventory → entri kategori dihapus (jadwal bersih).
 */
export async function syncWeeklyMenuFromInventory(
  categoryId: MenuCategoryId,
  options?: { from?: string; to?: string }
): Promise<SyncWeeklyMenuResult> {
  const defaults = defaultSyncRange();
  const range = {
    from: options?.from || defaults.from,
    to: options?.to || defaults.to,
  };
  const portalType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  const category = toMenuCategoryType(categoryId);

  const plans = await fetchProductionPlans(range.from, range.to);

  let skippedStatus = 0;
  let plansUsed = 0;

  /** dayDate (YYYY-MM-DD) → unique menu names */
  const byDate = new Map<string, { dayLabel: string; menus: string[] }>();
  const syncedNames = new Set<string>();

  for (const plan of plans) {
    const status = normalizePlanStatus(plan.status);
    if (!SYNCABLE_PLAN_STATUS.has(status)) {
      skippedStatus += 1;
      continue;
    }
    if (!plan.tanggal) continue;

    const menuDate = normalizePlanTanggal(plan.tanggal);
    if (!menuDate) continue;
    // Jangan tulis tanggal di luar rentang sync (hindari Senin 7 nyempil di minggu 14–18).
    if (menuDate < range.from || menuDate > range.to) continue;

    const dayLabel = dayLabelFromTanggal(menuDate);
    if (!dayLabel) continue;

    const resolvedNames: string[] = [];
    for (const line of plan.lines || []) {
      if (!lineMatchesCategory(line, plan, portalType)) continue;
      const nama = resolveLineName(line);
      if (nama) resolvedNames.push(nama);
    }
    if (!resolvedNames.length) continue;

    plansUsed += 1;
    const existing = byDate.get(menuDate) || { dayLabel, menus: [] };
    for (const n of resolvedNames) {
      if (!existing.menus.some((x) => x.toLowerCase() === n.toLowerCase())) {
        existing.menus.push(n);
      }
      syncedNames.add(n.toLowerCase());
    }
    byDate.set(menuDate, existing);
  }

  // Pertahankan deskripsi + foto (+ emoji kustom) yang sudah diedit admin.
  const previousRows = await findWeeklyMenuEntries({ category });
  type PreservedMedia = {
    description: string | null;
    imageUrl: string | null;
    emoji: string | null;
  };
  const mediaByDate = new Map<string, PreservedMedia>();
  const mediaByDayLabel = new Map<string, PreservedMedia>();
  for (const row of previousRows) {
    const hasMedia = Boolean(row.description || row.imageUrl);
    const customEmoji = Boolean(
      row.emoji && row.emoji !== DEFAULT_MENU_ICON
    );
    if (!hasMedia && !customEmoji) continue;
    const preserved: PreservedMedia = {
      description: row.description,
      imageUrl: row.imageUrl,
      emoji: row.emoji,
    };
    if (row.menuDate) mediaByDate.set(row.menuDate, preserved);
    mediaByDayLabel.set(row.dayLabel.trim().toLowerCase(), preserved);
  }

  const datedEntries = Array.from(byDate.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  // Sync kosong / semua status dilewati → jangan hapus jadwal & foto lokal.
  if (datedEntries.length === 0) {
    revalidatePublicContent({ menu: true });
    const detail = `${range.from} – ${range.to}; ${plansUsed}/${plans.length} rencana dipakai`;
    return {
      categoryId,
      from: range.from,
      to: range.to,
      daysWritten: 0,
      menusTouched: 0,
      menusPruned: 0,
      plansSeen: plans.length,
      plansUsed,
      skippedStatus,
      message: `Tidak ada rencana Disetujui/Diproses/Selesai untuk kategori ini (${detail}). Jadwal lokal tidak diubah.`,
    };
  }

  const syncedDates = new Set(datedEntries.map(([menuDate]) => menuDate));

  // Hapus hanya jadwal di luar minggu sync (minggu lama), BUKAN hari dalam
  // minggu operasional yang belum ada di Inventory (hindari sync parsial
  // menghapus Selasa–Jumat lokal bila Inventory baru kirim Senin).
  const staleIds = previousRows
    .filter((row) => {
      if (row.menuDate && syncedDates.has(row.menuDate)) return false;
      if (row.menuDate && row.menuDate >= range.from && row.menuDate <= range.to) {
        // Dalam rentang tapi tidak dihasil sync → biarkan (merge).
        return false;
      }
      if (row.menuDate && (row.menuDate < range.from || row.menuDate > range.to)) {
        return true; // minggu lama
      }
      // Tanpa menuDate: anggap stale kecuali dayLabel akan di-upsert dari sync
      const label = row.dayLabel.trim().toLowerCase();
      return !datedEntries.some(([, v]) => v.dayLabel.trim().toLowerCase() === label);
    })
    .map((row) => row.id);

  if (staleIds.length > 0) {
    await prisma.weeklyMenuEntry.deleteMany({
      where: { id: { in: staleIds } },
    });
  }

  let daysWritten = 0;
  let menusTouched = 0;

  for (const [menuDate, { dayLabel, menus }] of datedEntries) {
    if (!menus.length) continue;
    const menuText = menus.join(" · ");
    const preserved =
      mediaByDate.get(menuDate) ??
      mediaByDayLabel.get(dayLabel.trim().toLowerCase());

    const existingRow =
      previousRows.find((r) => r.menuDate === menuDate) ??
      previousRows.find(
        (r) => r.dayLabel.trim().toLowerCase() === dayLabel.trim().toLowerCase()
      );

    if (existingRow && !staleIds.includes(existingRow.id)) {
      await updateWeeklyMenuEntrySafe(existingRow.id, {
        dayLabel,
        menuDate,
        menuText,
        description: preserved?.description ?? existingRow.description,
        imageUrl: preserved?.imageUrl ?? existingRow.imageUrl,
        emoji: preserved?.emoji || existingRow.emoji || DEFAULT_MENU_ICON,
        sortOrder: sortOrderForDay(dayLabel),
        isActive: true,
      });
    } else {
      await createWeeklyMenuEntrySafe({
        category: category as MenuCategoryType,
        dayLabel,
        menuDate,
        menuText,
        description: preserved?.description ?? null,
        imageUrl: preserved?.imageUrl ?? null,
        emoji: preserved?.emoji || DEFAULT_MENU_ICON,
        sortOrder: sortOrderForDay(dayLabel),
        isActive: true,
      });
    }
    daysWritten += 1;
    for (const nama of menus) {
      await syncMenuItemFromWeekly(category as MenuCategoryType, nama, DEFAULT_MENU_ICON);
      menusTouched += 1;
    }
  }

  // Jangan prune jika Inventory mengembalikan 0 rencana di rentang
  // (kemungkinan URL/range salah) — hindari menghapus favorit secara tidak sengaja.
  const menusPruned =
    plans.length > 0
      ? await pruneOrphanMenuItems(category as MenuCategoryType, syncedNames)
      : 0;

  revalidatePublicContent({ menu: true });

  const detail = `${range.from} – ${range.to}; ${plansUsed}/${plans.length} rencana dipakai`;
  const pruneNote = menusPruned > 0 ? `; ${menusPruned} favorit lama dinonaktifkan` : "";

  return {
    categoryId,
    from: range.from,
    to: range.to,
    daysWritten,
    menusTouched,
    menusPruned,
    plansSeen: plans.length,
    plansUsed,
    skippedStatus,
    message:
      daysWritten > 0
        ? `Sinkron ${daysWritten} hari dari rencana produksi (${detail}${pruneNote})`
        : `Tidak ada rencana Disetujui/Diproses/Selesai untuk kategori ini (${detail})`,
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
