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

export function formatInspectionDateInput(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5;
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
