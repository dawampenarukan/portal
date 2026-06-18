import {
  OrganolepticPlaceType,
  OrganolepticSafety,
  OrganolepticTiming,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureOrganolepticSchemaOnce } from "@/lib/db-schema-sync";
import {
  averageScores,
  eachInspectionDateKeys,
  formatInspectionDateInput,
  formatInspectionTrendLabel,
  parseInspectionDate,
} from "@/lib/organoleptic-meta";
import { subDays } from "date-fns";
import {
  OrganolepticChecklistView,
  OrganolepticDailySummary,
  OrganolepticPublicView,
  OrganolepticUnsafeTrendPoint,
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
    criticismImages: string[];
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
    criticismImages: row.criticismImages ?? [],
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
  await ensureOrganolepticSchemaOnce();
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
  await ensureOrganolepticSchemaOnce();
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
  await ensureOrganolepticSchemaOnce();
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
  criticismImages?: string[];
  items: OrganolepticItemInput[];
}

export async function createOrganolepticChecklist(
  data: OrganolepticChecklistInput,
  createdById: string
) {
  await ensureOrganolepticSchemaOnce();
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
      criticismImages: data.criticismImages ?? [],
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
  unsafeTrend: [],
});

const TREND_DEFAULT_DAYS = 7;

function resolveTrendWindow(dateStr: string, dateEnd?: string | null) {
  if (dateEnd && dateEnd !== dateStr) {
    const from = parseInspectionDate(dateStr)!;
    const to = parseInspectionDate(dateEnd)!;
    const gte = from <= to ? from : to;
    const lte = from <= to ? to : from;
    return {
      from: formatInspectionDateInput(gte),
      to: formatInspectionDateInput(lte),
    };
  }

  const end = parseInspectionDate(dateStr)!;
  return {
    from: formatInspectionDateInput(subDays(end, TREND_DEFAULT_DAYS - 1)),
    to: dateStr,
  };
}

async function buildUnsafeTrend(
  fromStr: string,
  toStr: string
): Promise<OrganolepticUnsafeTrendPoint[]> {
  const from = parseInspectionDate(fromStr);
  const to = parseInspectionDate(toStr);
  if (!from || !to) return [];

  const gte = from <= to ? from : to;
  const lte = from <= to ? to : from;

  const checklists = await prisma.organolepticChecklist.findMany({
    where: { inspectionDate: { gte, lte } },
    include: { items: true },
  });

  const countByDate = new Map<string, number>();
  for (const checklist of checklists) {
    const key = formatInspectionDateInput(checklist.inspectionDate);
    const unsafe = checklist.items.filter(
      (item) => item.safety === OrganolepticSafety.TIDAK_AMAN
    ).length;
    countByDate.set(key, (countByDate.get(key) ?? 0) + unsafe);
  }

  return eachInspectionDateKeys(fromStr, toStr).map((key) => ({
    date: key,
    label: formatInspectionTrendLabel(key),
    count: countByDate.get(key) ?? 0,
  }));
}

type OrganolepticChecklistWithItems = {
  placeName: string;
  placeType: OrganolepticPlaceType;
  items: {
    tasteScore: number;
    colorScore: number;
    aromaScore: number;
    textureScore: number;
    safety: OrganolepticSafety;
  }[];
};

function buildPlaceSummaries(checklists: OrganolepticChecklistWithItems[]) {
  const groups = new Map<
    string,
    { placeName: string; placeType: OrganolepticPlaceType; items: OrganolepticChecklistWithItems["items"] }
  >();

  for (const checklist of checklists) {
    const key = `${checklist.placeType}:${checklist.placeName}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(...checklist.items);
    } else {
      groups.set(key, {
        placeName: checklist.placeName,
        placeType: checklist.placeType,
        items: [...checklist.items],
      });
    }
  }

  return Array.from(groups.values()).map((group) => ({
    placeName: group.placeName,
    placeType: group.placeType,
    safeCount: group.items.filter((i) => i.safety === OrganolepticSafety.AMAN).length,
    unsafeCount: group.items.filter((i) => i.safety === OrganolepticSafety.TIDAK_AMAN).length,
    avgOverall: averageScores(group.items).overall,
  }));
}

function buildSummaryFromChecklists(
  dateStr: string,
  checklists: OrganolepticChecklistWithItems[],
  dateEnd?: string
): OrganolepticDailySummary {
  const allItems = checklists.flatMap((c) => c.items);
  const safeCount = allItems.filter((i) => i.safety === OrganolepticSafety.AMAN).length;
  const unsafeCount = allItems.filter((i) => i.safety === OrganolepticSafety.TIDAK_AMAN).length;
  const avgs = averageScores(allItems);

  return {
    date: dateStr,
    ...(dateEnd ? { dateEnd } : {}),
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

async function buildPublicViewForDay(dateStr: string): Promise<OrganolepticPublicView> {
  const summary = await getOrganolepticDailySummary(dateStr);
  const checklists = await prisma.organolepticChecklist.findMany({
    where: { inspectionDate: parseInspectionDate(dateStr)! },
    include: { items: true },
    orderBy: [{ createdAt: "desc" }],
  });
  const trendWindow = resolveTrendWindow(dateStr);
  const unsafeTrend = await buildUnsafeTrend(trendWindow.from, trendWindow.to);

  return {
    summary,
    recentPlaces: buildPlaceSummaries(checklists),
    unsafeTrend,
  };
}

async function buildPublicViewForRange(
  dateFromInput: string,
  dateToInput: string
): Promise<OrganolepticPublicView> {
  const parsedFrom = parseInspectionDate(dateFromInput);
  const parsedTo = parseInspectionDate(dateToInput);
  if (!parsedFrom || !parsedTo) return emptyPublicView();

  const gte = parsedFrom <= parsedTo ? parsedFrom : parsedTo;
  const lte = parsedFrom <= parsedTo ? parsedTo : parsedFrom;
  const fromStr = formatInspectionDateInput(gte);
  const toStr = formatInspectionDateInput(lte);

  const checklists = await prisma.organolepticChecklist.findMany({
    where: { inspectionDate: { gte, lte } },
    include: { items: true },
    orderBy: [{ inspectionDate: "desc" }, { createdAt: "desc" }],
  });

  const trendWindow = resolveTrendWindow(fromStr, toStr);

  return {
    summary: buildSummaryFromChecklists(fromStr, checklists, toStr),
    recentPlaces: buildPlaceSummaries(checklists),
    unsafeTrend: await buildUnsafeTrend(trendWindow.from, trendWindow.to),
  };
}

export type OrganolepticPublicFilter = {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function getOrganolepticPublicDisplay(
  filter?: OrganolepticPublicFilter
): Promise<OrganolepticPublicView> {
  await ensureOrganolepticSchemaOnce();

  if (filter?.dateFrom && filter?.dateTo) {
    return buildPublicViewForRange(filter.dateFrom, filter.dateTo);
  }

  if (filter?.date) {
    return buildPublicViewForDay(filter.date);
  }

  let dateStr = formatInspectionDateInput(new Date());
  let view = await buildPublicViewForDay(dateStr);

  if (view.summary.checklistCount === 0) {
    const latest = await prisma.organolepticChecklist.findFirst({
      orderBy: { inspectionDate: "desc" },
      select: { inspectionDate: true },
    });
    if (!latest) return emptyPublicView();
    dateStr = formatInspectionDateInput(latest.inspectionDate);
    view = await buildPublicViewForDay(dateStr);
  }

  return view;
}
