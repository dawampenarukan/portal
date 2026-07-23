import { addDays, format, startOfWeek } from "date-fns";
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

export type WeekDayLabel = (typeof WEEK_DAYS)[number];

export function getDaySortOrder(dayLabel: string): number {
  const normalized = dayLabel.trim().toLowerCase();
  const idx = WEEK_DAYS.findIndex((d) => d.toLowerCase() === normalized);
  return idx >= 0 ? idx : 999;
}

export function sortOrderForDay(dayLabel: string): number {
  return getDaySortOrder(dayLabel);
}

/** Senin minggu berjalan (Asia/Jakarta) → YYYY-MM-DD untuk dayLabel. */
export function dateForDayLabelInCurrentWeek(
  dayLabel: string,
  ref = new Date()
): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ref);
  const monday = startOfWeek(new Date(`${ymd}T12:00:00`), { weekStartsOn: 1 });
  const offset = getDaySortOrder(dayLabel);
  const day = offset >= 0 && offset < 7 ? addDays(monday, offset) : monday;
  return format(day, "yyyy-MM-dd");
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
