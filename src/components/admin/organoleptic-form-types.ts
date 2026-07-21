import {
  ORGANOLEPTIC_ITEMS_PER_PACKAGE,
  deriveOrganolepticSafety,
  formatInspectionDateInput,
} from "@/lib/organoleptic-meta";
import type { OrganolepticChecklistView } from "@/lib/types";

export interface ItemForm {
  foodName: string;
  tasteScore: number;
  colorScore: number;
  aromaScore: number;
  textureScore: number;
  safety: "AMAN" | "TIDAK_AMAN";
  notes: string;
}

export interface HeaderForm {
  inspectorName: string;
  placeType: "SEKOLAH" | "POSYANDU" | "LAINNYA";
  placeName: string;
  inspectionDate: string;
  inspectionTime: string;
  timing: "SAAT_TIBA" | "SEBELUM_DIKONSUMSI";
  packagesReceived: string;
  packagesConsumed: string;
  packagesReturned: string;
  returnReason: string;
  criticism: string;
}

export function emptyItem(): ItemForm {
  return {
    foodName: "",
    tasteScore: 5,
    colorScore: 5,
    aromaScore: 5,
    textureScore: 5,
    safety: "AMAN",
    notes: "",
  };
}

export function emptyPackageItems(): ItemForm[] {
  return Array.from({ length: ORGANOLEPTIC_ITEMS_PER_PACKAGE }, () =>
    emptyItem()
  );
}

export function padItemsToPackage(items: ItemForm[]): ItemForm[] {
  const padded = [...items];
  while (padded.length < ORGANOLEPTIC_ITEMS_PER_PACKAGE) {
    padded.push(emptyItem());
  }
  return padded.slice(0, ORGANOLEPTIC_ITEMS_PER_PACKAGE);
}

export function isRowInactive(item: ItemForm): boolean {
  return !item.foodName.trim();
}

export function defaultHeader(): HeaderForm {
  const now = new Date();
  return {
    inspectorName: "",
    placeType: "SEKOLAH",
    placeName: "",
    inspectionDate: formatInspectionDateInput(now),
    inspectionTime: now.toTimeString().slice(0, 5),
    timing: "SAAT_TIBA",
    packagesReceived: "",
    packagesConsumed: "",
    packagesReturned: "",
    returnReason: "",
    criticism: "",
  };
}

export function packageCountToInput(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function parsePackageInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function nonNegIntOrZero(value: string): number {
  const n = parsePackageInput(value);
  return n ?? 0;
}

export function checklistToForm(checklist: OrganolepticChecklistView): {
  header: HeaderForm;
  criticismImages: string[];
  items: ItemForm[];
} {
  return {
    header: {
      inspectorName: checklist.inspectorName,
      placeType: checklist.placeType as HeaderForm["placeType"],
      placeName: checklist.placeName,
      inspectionDate: checklist.inspectionDate,
      inspectionTime: checklist.inspectionTime,
      timing: checklist.timing as HeaderForm["timing"],
      packagesReceived: packageCountToInput(checklist.packagesReceived),
      packagesConsumed: packageCountToInput(checklist.packagesConsumed),
      packagesReturned: packageCountToInput(checklist.packagesReturned),
      returnReason: checklist.returnReason ?? "",
      criticism: checklist.criticism ?? "",
    },
    criticismImages: checklist.criticismImages ?? [],
    items: padItemsToPackage(
      checklist.items.map((item) => {
        const scores = {
          tasteScore: item.tasteScore,
          colorScore: item.colorScore,
          aromaScore: item.aromaScore,
          textureScore: item.textureScore,
        };
        return {
          foodName: item.foodName,
          ...scores,
          safety: deriveOrganolepticSafety(scores),
          notes: item.notes ?? "",
        };
      })
    ),
  };
}

export const INACTIVE_FIELD_CLASS =
  "flex h-8 items-center justify-center rounded-lg border border-muted bg-muted/40 text-xs text-muted-foreground";

export const TABLE_CONTROL_CLASS = "h-8 rounded-lg border px-2 text-sm";
/** Kompak untuk kolom skor — samakan tinggi dengan input baris (h-8), jangan pakai leading-none (terpotong di Windows). */
export const TABLE_SCORE_CLASS =
  "mx-auto box-border block h-8 w-[3.25rem] min-w-0 max-w-[3.25rem] shrink-0 rounded-lg border border-input bg-background px-1 py-0 text-center text-sm leading-8";

export const SAFETY_SHORT_LABELS = {
  AMAN: "Aman",
  TIDAK_AMAN: "Tidak aman",
} as const;
