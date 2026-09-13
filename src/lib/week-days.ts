import { addDays, format, getDay, startOfWeek } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const WEEK_DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

/** Hari sekolah / Menu Minggu Ini (Senin–Jumat). */
export const SCHOOL_WEEK_DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
] as const;

export type WeekDayLabel = (typeof WEEK_DAYS)[number];
export type SchoolWeekDayLabel = (typeof SCHOOL_WEEK_DAYS)[number];

export function isSchoolWeekDay(dayLabel: string): boolean {
  const normalized = dayLabel.trim().toLowerCase();
  return SCHOOL_WEEK_DAYS.some((d) => d.toLowerCase() === normalized);
}

/** YYYY-MM-DD hari ini di Asia/Jakarta. */
export function jakartaTodayYmd(ref = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ref);
}

/** Label hari Indonesia untuk tanggal Jakarta hari ini (Senin…Minggu). */
export function jakartaTodayDayLabel(ref = new Date()): WeekDayLabel {
  const ymd = jakartaTodayYmd(ref);
  const raw = format(new Date(`${ymd}T12:00:00`), "EEEE", { locale: localeId });
  const label = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const match = WEEK_DAYS.find((w) => w.toLowerCase() === label.toLowerCase());
  return match ?? "Senin";
}

/**
 * Tanggal sasaran “Menu Hari Ini” untuk admin:
 * Senin–Jumat → hari ini; Sabtu–Minggu → Senin minggu depan
 * (selaras jadwal sekolah + sync Inventory).
 */
export function jakartaSchoolMenuTarget(ref = new Date()): {
  ymd: string;
  dayLabel: WeekDayLabel;
  isWeekendFallback: boolean;
} {
  const todayYmd = jakartaTodayYmd(ref);
  const noon = new Date(`${todayYmd}T12:00:00`);
  const dow = getDay(noon); // 0=Min … 6=Sab
  if (dow === 0 || dow === 6) {
    let monday = startOfWeek(noon, { weekStartsOn: 1 });
    monday = addDays(monday, 7);
    const ymd = format(monday, "yyyy-MM-dd");
    return { ymd, dayLabel: "Senin", isWeekendFallback: true };
  }
  return {
    ymd: todayYmd,
    dayLabel: jakartaTodayDayLabel(ref),
    isWeekendFallback: false,
  };
}

/** Senin minggu operasional (Sab/Min → Senin depan). */
export function operationalWeekMonday(ref = new Date()): Date {
  const todayYmd = jakartaTodayYmd(ref);
  const noon = new Date(`${todayYmd}T12:00:00`);
  let monday = startOfWeek(noon, { weekStartsOn: 1 });
  const dow = getDay(noon);
  if (dow === 0 || dow === 6) monday = addDays(monday, 7);
  return monday;
}

/** YYYY-MM-DD untuk dayLabel di minggu operasional sekolah. */
export function dateForDayLabelInOperationalWeek(
  dayLabel: string,
  ref = new Date()
): string {
  const monday = operationalWeekMonday(ref);
  const offset = getDaySortOrder(dayLabel);
  const day = offset >= 0 && offset < 7 ? addDays(monday, offset) : monday;
  return format(day, "yyyy-MM-dd");
}

/** Senin–Jumat minggu operasional (Sab/Min → minggu depan). */
export function operationalWeekRange(ref = new Date()): {
  from: string;
  to: string;
} {
  const monday = operationalWeekMonday(ref);
  return {
    from: format(monday, "yyyy-MM-dd"),
    to: format(addDays(monday, 4), "yyyy-MM-dd"),
  };
}

export function isYmdInOperationalWeek(
  ymd: string | null | undefined,
  ref = new Date()
): boolean {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const { from, to } = operationalWeekRange(ref);
  return ymd >= from && ymd <= to;
}

/**
 * Entri “Menu Minggu Ini” untuk minggu operasional.
 * - Ada menuDate → harus di Sen–Jum operasional
 * - Tanpa menuDate → dayLabel sekolah (Sen–Jum); tanggal efektif dari label
 */
export function isWeeklyEntryInOperationalWeek(
  entry: { menuDate?: string | null; dayLabel: string },
  ref = new Date()
): boolean {
  if (entry.menuDate) return isYmdInOperationalWeek(entry.menuDate, ref);
  if (!isSchoolWeekDay(entry.dayLabel)) return false;
  return isYmdInOperationalWeek(
    dateForDayLabelInOperationalWeek(entry.dayLabel, ref),
    ref
  );
}

/**
 * Tanggal aman untuk entri jadwal: pertahankan menuDate Inventory bila masih
 * di minggu operasional; kalau tidak, petakan ulang dari dayLabel.
 * Mencegah akhir pekan menimpa Senin 14 → Senin 7 (minggu kalender).
 */
export function resolveOperationalMenuDate(
  dayLabel: string,
  existingMenuDate?: string | null,
  ref = new Date()
): string {
  if (isYmdInOperationalWeek(existingMenuDate, ref)) {
    return existingMenuDate as string;
  }
  return dateForDayLabelInOperationalWeek(dayLabel, ref);
}

/** Cocokkan entri jadwal dengan hari kalender ini (publik). */
export function isMenuEntryToday(
  entry: { menuDate?: string | null; dayLabel: string },
  ref = new Date()
): boolean {
  const todayYmd = jakartaTodayYmd(ref);
  if (entry.menuDate) return entry.menuDate === todayYmd;
  return entry.dayLabel.trim().toLowerCase() === jakartaTodayDayLabel(ref).toLowerCase();
}

/** Cocokkan entri dengan target menu sekolah (admin / Sab–Min = Senin depan). */
export function isMenuEntrySchoolTarget(
  entry: { menuDate?: string | null; dayLabel: string },
  ref = new Date()
): boolean {
  const target = jakartaSchoolMenuTarget(ref);
  if (entry.menuDate) return entry.menuDate === target.ymd;
  return entry.dayLabel.trim().toLowerCase() === target.dayLabel.toLowerCase();
}

export function getDaySortOrder(dayLabel: string): number {
  const normalized = dayLabel.trim().toLowerCase();
  const idx = WEEK_DAYS.findIndex((d) => d.toLowerCase() === normalized);
  return idx >= 0 ? idx : 999;
}

export function sortOrderForDay(dayLabel: string): number {
  return getDaySortOrder(dayLabel);
}

/**
 * @deprecated Gunakan dateForDayLabelInOperationalWeek.
 * Alias agar pemanggilan lama tidak menulis Senin minggu kalender di akhir pekan
 * (mis. 7 Sep padahal Senin operasional 14 Sep).
 */
export function dateForDayLabelInCurrentWeek(
  dayLabel: string,
  ref = new Date()
): string {
  return dateForDayLabelInOperationalWeek(dayLabel, ref);
}

/** Tampil: "Senin - 27 Jul 2026" atau fallback dayLabel saja. */
export function formatWeeklyMenuHeading(
  dayLabel: string,
  menuDate?: string | null
): string {
  if (!menuDate || !/^\d{4}-\d{2}-\d{2}$/.test(menuDate)) {
    return dayLabel;
  }
  const d = new Date(`${menuDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dayLabel;
  const datePart = format(d, "d MMM yyyy", { locale: localeId });
  return `${dayLabel} - ${datePart}`;
}

export function compareWeeklyEntries(
  a: { menuDate?: string | null; dayLabel: string; sortOrder: number },
  b: { menuDate?: string | null; dayLabel: string; sortOrder: number }
): number {
  if (a.menuDate && b.menuDate && a.menuDate !== b.menuDate) {
    return a.menuDate.localeCompare(b.menuDate);
  }
  if (a.menuDate && !b.menuDate) return -1;
  if (!a.menuDate && b.menuDate) return 1;
  const dayDiff = getDaySortOrder(a.dayLabel) - getDaySortOrder(b.dayLabel);
  if (dayDiff !== 0) return dayDiff;
  return a.sortOrder - b.sortOrder;
}
