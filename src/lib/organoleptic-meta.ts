import type {
  OrganolepticPlaceType,
  OrganolepticSafety,
  OrganolepticTiming,
} from '@prisma/client';

/** Satu lembar checklist = satu sekolah/posyandu = satu paket MBG (maks. 5 item menu). */
export const ORGANOLEPTIC_ITEMS_PER_PACKAGE = 5;
/** Item 1–4 wajib; item ke-5 opsional (boleh dikosongkan). */
export const ORGANOLEPTIC_REQUIRED_ITEMS = 4;
export const ORGANOLEPTIC_OPTIONAL_ITEM_HINT = 'Silahkan diisi atau kosongkan';
/** Maksimal gambar lampiran di area kritik dan saran. */
export const ORGANOLEPTIC_MAX_CRITICISM_IMAGES = 3;

export function isOptionalOrganolepticRow(index: number): boolean {
  return index === ORGANOLEPTIC_ITEMS_PER_PACKAGE - 1;
}

export const ORGANOLEPTIC_SCORE_LABELS: Record<number, string> = {
  5: 'Sangat baik',
  4: 'Baik',
  3: 'Cukup',
  2: 'Kurang',
  1: 'Tidak baik',
};

export const ORGANOLEPTIC_SCORE_OPTIONS = [5, 4, 3, 2, 1] as const;

export const ORGANOLEPTIC_PLACE_LABELS: Record<OrganolepticPlaceType, string> =
  {
    SEKOLAH: 'Satuan Pendidikan',
    POSYANDU: 'Posyandu',
    LAINNYA: 'Lainnya',
  };

export const ORGANOLEPTIC_TIMING_LABELS: Record<OrganolepticTiming, string> = {
  SAAT_TIBA: 'Saat Tiba di Lokasi',
  SEBELUM_DIKONSUMSI: 'Sebelum dikonsumsi',
};

export const ORGANOLEPTIC_SAFETY_LABELS: Record<OrganolepticSafety, string> = {
  AMAN: 'Aman dikonsumsi',
  TIDAK_AMAN: 'Tidak aman dikonsumsi',
};

export function parseInspectionDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Format tanggal inspeksi konsisten UTC (cocok dengan @db.Date & parseInspectionDate). */
export function formatInspectionDateInput(date: Date | string): string {
  const d =
    typeof date === "string"
      ? (parseInspectionDate(date) ?? new Date(date))
      : date;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Label ringkas untuk chart trend, mis. "13/6". */
export function formatInspectionTrendLabel(dateKey: string): string {
  const d = parseInspectionDate(dateKey);
  if (!d) return dateKey;
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** Daftar kunci YYYY-MM-DD inklusif tanpa geser timezone lokal. */
export function eachInspectionDateKeys(fromStr: string, toStr: string): string[] {
  const from = parseInspectionDate(fromStr);
  const to = parseInspectionDate(toStr);
  if (!from || !to) return [];

  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  const keys: string[] = [];
  let cur = start;

  while (cur.getTime() <= end.getTime()) {
    keys.push(formatInspectionDateInput(cur));
    cur = new Date(cur.getTime() + 86_400_000);
  }

  return keys;
}

export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

/** Skor 1–2 pada rasa/warna/aroma/tekstur → tidak aman; selain itu aman. */
export function deriveOrganolepticSafety(scores: {
  tasteScore: number;
  colorScore: number;
  aromaScore: number;
  textureScore: number;
}): OrganolepticSafety {
  const values = [
    scores.tasteScore,
    scores.colorScore,
    scores.aromaScore,
    scores.textureScore,
  ];
  return values.some((score) => score <= 2)
    ? "TIDAK_AMAN"
    : "AMAN";
}

export function averageScores(
  items: {
    tasteScore: number;
    colorScore: number;
    aromaScore: number;
    textureScore: number;
  }[]
) {
  if (items.length === 0) {
    return { taste: 0, color: 0, aroma: 0, texture: 0, overall: 0 };
  }
  const totals = items.reduce(
    (acc, item) => ({
      taste: acc.taste + item.tasteScore,
      color: acc.color + item.colorScore,
      aroma: acc.aroma + item.aromaScore,
      texture: acc.texture + item.textureScore,
    }),
    { taste: 0, color: 0, aroma: 0, texture: 0 }
  );
  const count = items.length;
  const taste = totals.taste / count;
  const color = totals.color / count;
  const aroma = totals.aroma / count;
  const texture = totals.texture / count;
  return {
    taste,
    color,
    aroma,
    texture,
    overall: (taste + color + aroma + texture) / 4,
  };
}

export function formatOrganolepticPeriodLabel(date: string, dateEnd?: string): string {
  const fmt = (value: string) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00.000Z`));

  if (dateEnd && dateEnd !== date) {
    return `${fmt(date)} – ${fmt(dateEnd)}`;
  }
  return fmt(date);
}

/** Normalisasi rentang tanggal inspeksi (inklusif, urutan naik). */
export function normalizeInspectionDateRange(
  date?: string | null,
  dateEnd?: string | null
): { from: string; to: string } | null {
  if (!date) return null;
  const fromParsed = parseInspectionDate(date);
  if (!fromParsed) return null;

  const toParsed = dateEnd ? parseInspectionDate(dateEnd) : fromParsed;
  if (!toParsed) return null;

  const from =
    fromParsed <= toParsed
      ? formatInspectionDateInput(fromParsed)
      : formatInspectionDateInput(toParsed);
  const to =
    fromParsed <= toParsed
      ? formatInspectionDateInput(toParsed)
      : formatInspectionDateInput(fromParsed);

  return { from, to };
}

/** Checklist masih punya temuan yang perlu notice (belum dievaluasi). */
export function checklistHasOpenFindings(checklist: {
  evaluatedAt?: string | null;
  packagesReturned?: number | null;
  items: { safety: string }[];
}): boolean {
  if (checklist.evaluatedAt) return false;
  const unsafe = checklist.items.some((i) => i.safety === "TIDAK_AMAN");
  const returned = (checklist.packagesReturned ?? 0) > 0;
  return unsafe || returned;
}

/** Link notice badge → halaman checklist (1 tahun terakhir + filter fokus). */
export function organolepticNoticeHref(focus: "unsafe" | "returned"): string {
  const to = formatInspectionDateInput(new Date());
  const fromDate = new Date(`${to}T00:00:00.000Z`);
  fromDate.setUTCFullYear(fromDate.getUTCFullYear() - 1);
  const from = formatInspectionDateInput(fromDate);
  const params = new URLSearchParams({
    date: from,
    dateEnd: to,
    focus,
  });
  return `/admin/menu/organoleptik?${params.toString()}`;
}
