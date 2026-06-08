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
