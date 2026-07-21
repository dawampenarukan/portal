import {
  deriveOrganolepticSafety,
  isOrganolepticPlaceTypeId,
  isOrganolepticTimingId,
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

  const tasteScore = Number(item.tasteScore);
  const colorScore = Number(item.colorScore);
  const aromaScore = Number(item.aromaScore);
  const textureScore = Number(item.textureScore);

  return {
    foodName,
    tasteScore,
    colorScore,
    aromaScore,
    textureScore,
    safety: deriveOrganolepticSafety({
      tasteScore,
      colorScore,
      aromaScore,
      textureScore,
    }),
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
  if (!isOrganolepticPlaceTypeId(placeType)) {
    return { error: "Tempat pemeriksaan tidak valid" };
  }
  if (!isOrganolepticTimingId(timing)) {
    return { error: "Waktu uji tidak valid" };
  }

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

  function parsePackageCount(value: unknown, label: string): number | null | string {
    if (value === undefined || value === null || value === "") return null;
    const n = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isInteger(n) || n < 0) {
      return `${label} harus bilangan bulat ≥ 0`;
    }
    return n;
  }

  const packagesConsumed = parsePackageCount(raw.packagesConsumed, "Paket yang dikonsumsi");
  if (typeof packagesConsumed === "string") return { error: packagesConsumed };
  const packagesReturned = parsePackageCount(raw.packagesReturned, "Paket yang dikembalikan");
  if (typeof packagesReturned === "string") return { error: packagesReturned };
  const packagesReceivedRaw = parsePackageCount(raw.packagesReceived, "Paket diterima");
  if (typeof packagesReceivedRaw === "string") return { error: packagesReceivedRaw };

  let packagesReceived: number | null = null;
  let packagesConsumedOut: number | null = packagesConsumed;
  let packagesReturnedOut: number | null = packagesReturned;

  if (
    packagesReceivedRaw !== null ||
    packagesConsumed !== null ||
    packagesReturned !== null
  ) {
    let received = packagesReceivedRaw ?? 0;
    let consumed = packagesConsumed ?? 0;
    let returned = packagesReturned ?? 0;

    if (packagesReceivedRaw === null) {
      // Diisi dari bagian dulu
      received = consumed + returned;
    } else if (consumed > 0 || returned > 0) {
      // Mode diterima + sudah ada alokasi → jaga persamaan
      consumed = Math.min(consumed, received);
      returned = Math.max(0, received - consumed);
    } else {
      consumed = 0;
      returned = 0;
    }

    packagesReceived = received;
    packagesConsumedOut = consumed;
    packagesReturnedOut = returned;
  }

  if (
    packagesReceived !== null &&
    (packagesConsumedOut ?? 0) + (packagesReturnedOut ?? 0) > packagesReceived
  ) {
    return {
      error: "Jumlah dikonsumsi + dikembalikan tidak boleh melebihi paket diterima",
    };
  }

  const returnReason =
    typeof raw.returnReason === "string" ? raw.returnReason.trim() : "";
  if ((packagesReturnedOut ?? 0) > 0 && !returnReason) {
    return { error: "Alasan pengembalian paket wajib diisi" };
  }

  return {
    data: {
      inspectorName,
      placeType,
      placeName,
      inspectionDate,
      inspectionTime,
      timing,
      packagesReceived,
      packagesConsumed: packagesConsumedOut,
      packagesReturned: packagesReturnedOut,
      returnReason: (packagesReturnedOut ?? 0) > 0 ? returnReason : null,
      criticism: typeof raw.criticism === "string" ? raw.criticism : null,
      criticismImages,
      items,
    },
  };
}
