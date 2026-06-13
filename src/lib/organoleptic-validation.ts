import {
  OrganolepticPlaceType,
  OrganolepticSafety,
  OrganolepticTiming,
} from "@prisma/client";
import {
  isValidScore,
  ORGANOLEPTIC_ITEMS_PER_PACKAGE,
  ORGANOLEPTIC_MAX_CRITICISM_IMAGES,
  ORGANOLEPTIC_REQUIRED_ITEMS,
  parseInspectionDate,
} from "@/lib/organoleptic-meta";
import type {
  OrganolepticChecklistInput,
  OrganolepticItemInput,
} from "@/lib/organoleptic-queries";

const PLACE_TYPES = new Set<string>(Object.values(OrganolepticPlaceType));
const TIMINGS = new Set<string>(Object.values(OrganolepticTiming));
const SAFETIES = new Set<string>(Object.values(OrganolepticSafety));

function parseItem(raw: unknown, index: number): OrganolepticItemInput | string {
  if (!raw || typeof raw !== "object") {
    return `Baris ${index + 1}: data tidak valid`;
  }
  const item = raw as Record<string, unknown>;
  const foodName = typeof item.foodName === "string" ? item.foodName.trim() : "";

  if (!foodName) {
    return `Baris ${index + 1}: nama makanan wajib diisi`;
  }

  const scores = ["tasteScore", "colorScore", "aromaScore", "textureScore"] as const;
  for (const key of scores) {
    const score = Number(item[key]);
    if (!isValidScore(score)) {
      return `Baris ${index + 1}: skor ${key} harus 1–5`;
    }
  }

  const safety = String(item.safety ?? "");
  if (!SAFETIES.has(safety)) {
    return `Baris ${index + 1}: kesimpulan aman/tidak aman wajib dipilih`;
  }

  return {
    foodName,
    tasteScore: Number(item.tasteScore),
    colorScore: Number(item.colorScore),
    aromaScore: Number(item.aromaScore),
    textureScore: Number(item.textureScore),
    safety: safety as OrganolepticSafety,
    notes: typeof item.notes === "string" ? item.notes : null,
  };
}

export function parseOrganolepticPayload(
  body: unknown
): { data: OrganolepticChecklistInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Payload tidak valid" };
  }

  const raw = body as Record<string, unknown>;
  const inspectorName =
    typeof raw.inspectorName === "string" ? raw.inspectorName.trim() : "";
  const placeName = typeof raw.placeName === "string" ? raw.placeName.trim() : "";
  const inspectionDate =
    typeof raw.inspectionDate === "string" ? raw.inspectionDate : "";
  const inspectionTime =
    typeof raw.inspectionTime === "string" ? raw.inspectionTime.trim() : "";
  const placeType = String(raw.placeType ?? "");
  const timing = String(raw.timing ?? "");

  if (!inspectorName) return { error: "Nama pemeriksa wajib diisi" };
  if (!placeName) return { error: "Nama tempat pemeriksaan wajib diisi" };
  if (!parseInspectionDate(inspectionDate)) return { error: "Tanggal tidak valid" };
  if (!inspectionTime) return { error: "Waktu pemeriksaan wajib diisi" };
  if (!PLACE_TYPES.has(placeType)) return { error: "Tempat pemeriksaan tidak valid" };
  if (!TIMINGS.has(timing)) return { error: "Waktu uji tidak valid" };

  if (!Array.isArray(raw.items) || raw.items.length === 0) {
    return {
      error: `Minimal ${ORGANOLEPTIC_REQUIRED_ITEMS} item menu wajib diisi`,
    };
  }

  if (raw.items.length > ORGANOLEPTIC_ITEMS_PER_PACKAGE) {
    return {
      error: `Maksimal ${ORGANOLEPTIC_ITEMS_PER_PACKAGE} item menu per paket`,
    };
  }

  const items: OrganolepticItemInput[] = [];
  for (let i = 0; i < raw.items.length; i++) {
    const parsed = parseItem(raw.items[i], i);
    if (typeof parsed === "string") return { error: parsed };
    items.push(parsed);
  }

  if (items.length < ORGANOLEPTIC_REQUIRED_ITEMS) {
    return {
      error: `Minimal ${ORGANOLEPTIC_REQUIRED_ITEMS} item menu wajib diisi`,
    };
  }

  let criticismImages: string[] = [];
  if (raw.criticismImages !== undefined) {
    if (!Array.isArray(raw.criticismImages)) {
      return { error: "Format gambar tidak valid" };
    }
    criticismImages = raw.criticismImages
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      .map((url) => url.trim());
    if (criticismImages.length > ORGANOLEPTIC_MAX_CRITICISM_IMAGES) {
      return {
        error: `Maksimal ${ORGANOLEPTIC_MAX_CRITICISM_IMAGES} gambar di kritik dan saran`,
      };
    }
  }

  return {
    data: {
      inspectorName,
      placeType: placeType as OrganolepticPlaceType,
      placeName,
      inspectionDate,
      inspectionTime,
      timing: timing as OrganolepticTiming,
      criticism: typeof raw.criticism === "string" ? raw.criticism : null,
      criticismImages,
      items,
    },
  };
}
