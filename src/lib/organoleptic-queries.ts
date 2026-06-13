import {
  OrganolepticPlaceType,
  OrganolepticSafety,
  OrganolepticTiming,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  averageScores,
  formatInspectionDateInput,
  parseInspectionDate,
} from "@/lib/organoleptic-meta";
import type {
  OrganolepticChecklistView,
  OrganolepticDailySummary,
  OrganolepticPublicView,
} from "@/lib/types";

function mapChecklist(
  row: {
    id: string;
    inspectorName: string;
    placeType: OrganolepticPlaceType;
    placeName: string;
    inspectionDate: Date;
    inspectionTime: string;
    timing: OrganolepticTiming;
    criticism: string | null;
    createdById: string | null;
    createdAt: Date;
    createdBy?: { name: string } | null;
    items: {
      id: string;
      sortOrder: number;
      foodName: string;
      tasteScore: number;
      colorScore: number;
      aromaScore: number;
      textureScore: number;
      safety: OrganolepticSafety;
      notes: string | null;
    }[];
  }
): OrganolepticChecklistView {
  return {
    id: row.id,
    inspectorName: row.inspectorName,
    placeType: row.placeType,
    placeName: row.placeName,
    inspectionDate: formatInspectionDateInput(row.inspectionDate),
    inspectionTime: row.inspectionTime,
    timing: row.timing,
    criticism: row.criticism,
    createdById: row.createdById,
    createdByName: row.createdBy?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    items: row.items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        sortOrder: item.sortOrder,
        foodName: item.foodName,
        tasteScore: item.tasteScore,
        colorScore: item.colorScore,
        aromaScore: item.aromaScore,
        textureScore: item.textureScore,
        safety: item.safety,
        notes: item.notes,
      })),
  };
}

export async function getOrganolepticChecklists(options?: {
  date?: string;
  limit?: number;
  createdById?: string;
}): Promise<OrganolepticChecklistView[]> {
  const parsedDate = options?.date ? parseInspectionDate(options.date) : null;
  const rows = await prisma.organolepticChecklist.findMany({
    where: {
      ...(parsedDate ? { inspectionDate: parsedDate } : {}),
      ...(options?.createdById ? { createdById: options.createdById } : {}),
    },
    include: { items: true, createdBy: { select: { name: true } } },
    orderBy: [{ inspectionDate: "desc" }, { createdAt: "desc" }],
    take: options?.limit,
  });
  return rows.map(mapChecklist);
}

export async function getOrganolepticChecklistById(
  id: string
): Promise<OrganolepticChecklistView | null> {
  const row = await prisma.organolepticChecklist.findUnique({
    where: { id },
    include: { items: true, createdBy: { select: { name: true } } },
  });
  return row ? mapChecklist(row) : null;
}

export async function getOrganolepticChecklistOwnership(id: string) {
  return prisma.organolepticChecklist.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });
}

export async function getOrganolepticDailySummary(
  dateInput?: string,
  createdById?: string
): Promise<OrganolepticDailySummary> {
  const date = dateInput
    ? parseInspectionDate(dateInput)
    : new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");

  if (!date) {
    return {
      date: dateInput ?? formatInspectionDateInput(new Date()),
      checklistCount: 0,
      itemCount: 0,
      safeCount: 0,
      unsafeCount: 0,
      avgTaste: 0,
      avgColor: 0,
      avgAroma: 0,
      avgTexture: 0,
      avgOverall: 0,
    };
  }

  const checklists = await prisma.organolepticChecklist.findMany({
    where: {
      inspectionDate: date,
      ...(createdById ? { createdById } : {}),
    },
    include: { items: true },
  });

  const allItems = checklists.flatMap((c) => c.items);
  const safeCount = allItems.filter((i) => i.safety === OrganolepticSafety.AMAN).length;
  const unsafeCount = allItems.filter((i) => i.safety === OrganolepticSafety.TIDAK_AMAN).length;
  const avgs = averageScores(allItems);

  return {
    date: formatInspectionDateInput(date),
    checklistCount: checklists.length,
    itemCount: allItems.length,
    safeCount,
    unsafeCount,
    avgTaste: avgs.taste,
    avgColor: avgs.color,
    avgAroma: avgs.aroma,
    avgTexture: avgs.texture,
    avgOverall: avgs.overall,
  };
}

export interface OrganolepticItemInput {
  foodName: string;
  tasteScore: number;
  colorScore: number;
  aromaScore: number;
  textureScore: number;
  safety: OrganolepticSafety;
  notes?: string | null;
}

export interface OrganolepticChecklistInput {
  inspectorName: string;
  placeType: OrganolepticPlaceType;
  placeName: string;
  inspectionDate: string;
  inspectionTime: string;
  timing: OrganolepticTiming;
  criticism?: string | null;
  items: OrganolepticItemInput[];
}

export async function createOrganolepticChecklist(
  data: OrganolepticChecklistInput,
  createdById: string
) {
  const inspectionDate = parseInspectionDate(data.inspectionDate);
  if (!inspectionDate) throw new Error("Tanggal tidak valid");

  const row = await prisma.organolepticChecklist.create({
    data: {
      inspectorName: data.inspectorName.trim(),
      placeType: data.placeType,
      placeName: data.placeName.trim(),
      inspectionDate,
      inspectionTime: data.inspectionTime.trim(),
      timing: data.timing,
      criticism: data.criticism?.trim() || null,
      createdById,
      items: {
        create: data.items.map((item, index) => ({
          sortOrder: index,
          foodName: item.foodName.trim(),
          tasteScore: item.tasteScore,
          colorScore: item.colorScore,
          aromaScore: item.aromaScore,
          textureScore: item.textureScore,
          safety: item.safety,
          notes: item.notes?.trim() || null,
        })),
      },
    },
    include: { items: true, createdBy: { select: { name: true } } },
  });

  return mapChecklist(row);
}

export async function deleteOrganolepticChecklist(id: string) {
  return prisma.organolepticChecklist.delete({ where: { id } });
}

const emptyPublicView = (): OrganolepticPublicView => ({
  summary: {
    date: formatInspectionDateInput(new Date()),
    checklistCount: 0,
    itemCount: 0,
    safeCount: 0,
    unsafeCount: 0,
    avgTaste: 0,
    avgColor: 0,
    avgAroma: 0,
    avgTexture: 0,
    avgOverall: 0,
  },
  recentPlaces: [],
});

export async function getOrganolepticPublicDisplay(): Promise<OrganolepticPublicView> {
  let dateStr = formatInspectionDateInput(new Date());
  let summary = await getOrganolepticDailySummary(dateStr);

  if (summary.checklistCount === 0) {
    const latest = await prisma.organolepticChecklist.findFirst({
      orderBy: { inspectionDate: "desc" },
      select: { inspectionDate: true },
    });
    if (!latest) return emptyPublicView();
    dateStr = formatInspectionDateInput(latest.inspectionDate);
    summary = await getOrganolepticDailySummary(dateStr);
  }

  const checklists = await getOrganolepticChecklists({ date: dateStr, limit: 8 });
  const recentPlaces = checklists.map((c) => ({
    placeName: c.placeName,
    placeType: c.placeType,
    safeCount: c.items.filter((i) => i.safety === OrganolepticSafety.AMAN).length,
    unsafeCount: c.items.filter((i) => i.safety === OrganolepticSafety.TIDAK_AMAN).length,
    avgOverall: averageScores(c.items).overall,
  }));

  return { summary, recentPlaces };
}
