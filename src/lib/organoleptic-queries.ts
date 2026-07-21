import "server-only";

import {
  OrganolepticPlaceType,
  OrganolepticSafety,
  OrganolepticTiming,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  averageScores,
  eachInspectionDateKeys,
  formatInspectionDateInput,
  formatInspectionTrendLabel,
  normalizeInspectionDateRange,
  parseInspectionDate,
  ORGANOLEPTIC_LIST_DEFAULT_LIMIT,
  ORGANOLEPTIC_LIST_HARD_CAP,
  type OrganolepticPlaceTypeId,
  type OrganolepticSafetyId,
  type OrganolepticTimingId,
} from "@/lib/organoleptic-meta";
import {
  OrganolepticChecklistView,
  OrganolepticDailySummary,
  OrganolepticPublicView,
  OrganolepticUnsafeTrendPoint,
} from "@/lib/types";

export { ORGANOLEPTIC_LIST_DEFAULT_LIMIT, ORGANOLEPTIC_LIST_HARD_CAP };

function shiftInspectionDateKey(dateStr: string, deltaDays: number): string {
  const d = parseInspectionDate(dateStr)!;
  const shifted = new Date(d.getTime());
  shifted.setUTCDate(shifted.getUTCDate() + deltaDays);
  return formatInspectionDateInput(shifted);
}

function mapChecklist(
  row: {
    id: string;
    inspectorName: string;
    placeType: OrganolepticPlaceType;
    placeName: string;
    inspectionDate: Date;
    inspectionTime: string;
    timing: OrganolepticTiming;
    packagesReceived?: number | null;
    packagesConsumed?: number | null;
    packagesReturned?: number | null;
    returnReason?: string | null;
    criticism: string | null;
    criticismImages: string[];
    evaluatedAt?: Date | null;
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
    packagesReceived: row.packagesReceived ?? null,
    packagesConsumed: row.packagesConsumed ?? null,
    packagesReturned: row.packagesReturned ?? null,
    returnReason: row.returnReason ?? null,
    criticism: row.criticism,
    criticismImages: row.criticismImages ?? [],
    evaluatedAt: row.evaluatedAt ? row.evaluatedAt.toISOString() : null,
    createdById: row.createdById,
    createdByName: row.createdBy?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    items: row.items
      .slice()
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

function inspectionDateFilter(date?: string, dateEnd?: string) {
  const range = normalizeInspectionDateRange(date, dateEnd);
  if (!range) return {};
  const gte = parseInspectionDate(range.from)!;
  const lte = parseInspectionDate(range.to)!;
  if (range.from === range.to) {
    return { inspectionDate: gte };
  }
  return { inspectionDate: { gte, lte } };
}

const checklistDetailSelect = {
  id: true,
  inspectorName: true,
  placeType: true,
  placeName: true,
  inspectionDate: true,
  inspectionTime: true,
  timing: true,
  packagesReceived: true,
  packagesConsumed: true,
  packagesReturned: true,
  returnReason: true,
  criticism: true,
  criticismImages: true,
  evaluatedAt: true,
  createdById: true,
  createdAt: true,
  createdBy: { select: { name: true } },
  items: {
    select: {
      id: true,
      sortOrder: true,
      foodName: true,
      tasteScore: true,
      colorScore: true,
      aromaScore: true,
      textureScore: true,
      safety: true,
      notes: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
};

/** List admin: tanpa criticism/images/notes — cukup untuk kartu ringkas. */
const checklistListSelect = {
  id: true,
  inspectorName: true,
  placeType: true,
  placeName: true,
  inspectionDate: true,
  inspectionTime: true,
  timing: true,
  packagesReturned: true,
  evaluatedAt: true,
  createdById: true,
  createdAt: true,
  createdBy: { select: { name: true } },
  items: {
    select: {
      id: true,
      sortOrder: true,
      tasteScore: true,
      colorScore: true,
      aromaScore: true,
      textureScore: true,
      safety: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
};

export type OrganolepticFocusFilter = "unsafe" | "returned";

export type OrganolepticChecklistListResult = {
  checklists: OrganolepticChecklistView[];
  truncated: boolean;
  limit: number;
};

function focusWhere(focus?: OrganolepticFocusFilter | null) {
  if (focus === "unsafe") {
    return {
      evaluatedAt: null,
      items: { some: { safety: OrganolepticSafety.TIDAK_AMAN } },
    };
  }
  if (focus === "returned") {
    return {
      evaluatedAt: null,
      packagesReturned: { gt: 0 },
    };
  }
  return {};
}

export async function getOrganolepticChecklists(options?: {
  date?: string;
  dateEnd?: string;
  limit?: number;
  createdById?: string;
  focus?: OrganolepticFocusFilter | null;
}): Promise<OrganolepticChecklistListResult> {
  const requested =
    options?.limit && options.limit > 0
      ? options.limit
      : ORGANOLEPTIC_LIST_DEFAULT_LIMIT;
  const limit = Math.min(requested, ORGANOLEPTIC_LIST_HARD_CAP);

  // Ambil limit+1 untuk deteksi truncate akurat (hindari false positive saat tepat = limit).
  const rows = await prisma.organolepticChecklist.findMany({
    where: {
      ...inspectionDateFilter(options?.date, options?.dateEnd),
      ...(options?.createdById ? { createdById: options.createdById } : {}),
      ...focusWhere(options?.focus),
    },
    select: checklistListSelect,
    orderBy: [{ inspectionDate: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
  });

  const truncated = rows.length > limit;
  const page = truncated ? rows.slice(0, limit) : rows;

  return {
    checklists: page.map((row) =>
      mapChecklist({
        ...row,
        packagesReceived: null,
        packagesConsumed: null,
        returnReason: null,
        criticism: null,
        criticismImages: [],
        items: row.items.map((item) => ({
          ...item,
          foodName: "",
          notes: null,
        })),
      })
    ),
    truncated,
    limit,
  };
}

export async function getOrganolepticChecklistById(
  id: string
): Promise<OrganolepticChecklistView | null> {
  const row = await prisma.organolepticChecklist.findUnique({
    where: { id },
    select: checklistDetailSelect,
  });
  if (!row) return null;
  return mapChecklist(row);
}

export async function getOrganolepticChecklistOwnership(id: string) {
  return prisma.organolepticChecklist.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });
}

type SummaryAggregateRow = {
  checklistCount: number;
  itemCount: number;
  safeCount: number;
  unsafeCount: number;
  avgTaste: number;
  avgColor: number;
  avgAroma: number;
  avgTexture: number;
};

export async function getOrganolepticDailySummary(
  dateInput?: string,
  createdById?: string,
  dateEndInput?: string
): Promise<OrganolepticDailySummary> {
  const fallback = formatInspectionDateInput(new Date());
  const range = normalizeInspectionDateRange(
    dateInput ?? fallback,
    dateEndInput ?? dateInput ?? fallback
  );

  if (!range) {
    return {
      date: dateInput ?? fallback,
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

  const gte = parseInspectionDate(range.from)!;
  const lte = parseInspectionDate(range.to)!;

  const [row] = createdById
    ? await prisma.$queryRaw<SummaryAggregateRow[]>`
        SELECT
          COUNT(DISTINCT c."id")::int AS "checklistCount",
          COUNT(i."id")::int AS "itemCount",
          COUNT(i."id") FILTER (WHERE i."safety" = 'AMAN'::"OrganolepticSafety")::int AS "safeCount",
          COUNT(i."id") FILTER (WHERE i."safety" = 'TIDAK_AMAN'::"OrganolepticSafety")::int AS "unsafeCount",
          COALESCE(AVG(i."tasteScore"), 0)::float AS "avgTaste",
          COALESCE(AVG(i."colorScore"), 0)::float AS "avgColor",
          COALESCE(AVG(i."aromaScore"), 0)::float AS "avgAroma",
          COALESCE(AVG(i."textureScore"), 0)::float AS "avgTexture"
        FROM "OrganolepticChecklist" c
        LEFT JOIN "OrganolepticItem" i ON i."checklistId" = c."id"
        WHERE c."inspectionDate" >= ${gte}
          AND c."inspectionDate" <= ${lte}
          AND c."createdById" = ${createdById}
      `
    : await prisma.$queryRaw<SummaryAggregateRow[]>`
        SELECT
          COUNT(DISTINCT c."id")::int AS "checklistCount",
          COUNT(i."id")::int AS "itemCount",
          COUNT(i."id") FILTER (WHERE i."safety" = 'AMAN'::"OrganolepticSafety")::int AS "safeCount",
          COUNT(i."id") FILTER (WHERE i."safety" = 'TIDAK_AMAN'::"OrganolepticSafety")::int AS "unsafeCount",
          COALESCE(AVG(i."tasteScore"), 0)::float AS "avgTaste",
          COALESCE(AVG(i."colorScore"), 0)::float AS "avgColor",
          COALESCE(AVG(i."aromaScore"), 0)::float AS "avgAroma",
          COALESCE(AVG(i."textureScore"), 0)::float AS "avgTexture"
        FROM "OrganolepticChecklist" c
        LEFT JOIN "OrganolepticItem" i ON i."checklistId" = c."id"
        WHERE c."inspectionDate" >= ${gte}
          AND c."inspectionDate" <= ${lte}
      `;

  const itemCount = Number(row?.itemCount ?? 0);
  const avgTaste = Number(row?.avgTaste ?? 0);
  const avgColor = Number(row?.avgColor ?? 0);
  const avgAroma = Number(row?.avgAroma ?? 0);
  const avgTexture = Number(row?.avgTexture ?? 0);

  return {
    date: range.from,
    dateEnd: range.to !== range.from ? range.to : undefined,
    checklistCount: Number(row?.checklistCount ?? 0),
    itemCount,
    safeCount: Number(row?.safeCount ?? 0),
    unsafeCount: Number(row?.unsafeCount ?? 0),
    avgTaste,
    avgColor,
    avgAroma,
    avgTexture,
    avgOverall:
      itemCount > 0 ? (avgTaste + avgColor + avgAroma + avgTexture) / 4 : 0,
  };
}

export interface OrganolepticItemInput {
  foodName: string;
  tasteScore: number;
  colorScore: number;
  aromaScore: number;
  textureScore: number;
  safety: OrganolepticSafetyId;
  notes?: string | null;
}

export interface OrganolepticChecklistInput {
  inspectorName: string;
  placeType: OrganolepticPlaceTypeId;
  placeName: string;
  inspectionDate: string;
  inspectionTime: string;
  timing: OrganolepticTimingId;
  packagesReceived?: number | null;
  packagesConsumed?: number | null;
  packagesReturned?: number | null;
  returnReason?: string | null;
  criticism?: string | null;
  criticismImages?: string[];
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
      packagesReceived: data.packagesReceived ?? null,
      packagesConsumed: data.packagesConsumed ?? null,
      packagesReturned: data.packagesReturned ?? null,
      returnReason: data.returnReason?.trim() || null,
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
    select: checklistDetailSelect,
  });

  return mapChecklist(row);
}

export async function deleteOrganolepticChecklist(id: string) {
  return prisma.organolepticChecklist.delete({ where: { id } });
}

export async function evaluateOrganolepticChecklist(id: string) {
  try {
    const row = await prisma.organolepticChecklist.update({
      where: { id },
      data: { evaluatedAt: new Date() },
      select: checklistDetailSelect,
    });
    return mapChecklist(row);
  } catch {
    throw new Error("Checklist tidak ditemukan");
  }
}

export interface OrganolepticAdminNotices {
  unsafeCount: number;
  returnedPackagesCount: number;
}

/** Agregat notice untuk badge navigasi admin — hanya temuan belum dievaluasi. */
export async function getOrganolepticAdminNotices(): Promise<OrganolepticAdminNotices> {
  const [unsafeRow] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "OrganolepticItem" i
    INNER JOIN "OrganolepticChecklist" c ON c."id" = i."checklistId"
    WHERE i."safety" = 'TIDAK_AMAN'::"OrganolepticSafety"
      AND c."evaluatedAt" IS NULL
  `;

  const [returnedRow] = await prisma.$queryRaw<{ sum: number }[]>`
    SELECT COALESCE(SUM(c."packagesReturned"), 0)::int AS sum
    FROM "OrganolepticChecklist" c
    WHERE c."packagesReturned" > 0
      AND c."evaluatedAt" IS NULL
  `;

  return {
    unsafeCount: Number(unsafeRow?.count ?? 0),
    returnedPackagesCount: Number(returnedRow?.sum ?? 0),
  };
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

  const daysBefore = Math.floor((TREND_DEFAULT_DAYS - 1) / 2);
  const daysAfter = TREND_DEFAULT_DAYS - 1 - daysBefore;
  return {
    from: shiftInspectionDateKey(dateStr, -daysBefore),
    to: shiftInspectionDateKey(dateStr, daysAfter),
  };
}

function buildUnsafeTrendFromChecklists(
  checklists: {
    inspectionDate: Date;
    items: { safety: OrganolepticSafety }[];
  }[],
  fromStr: string,
  toStr: string
): OrganolepticUnsafeTrendPoint[] {
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
    {
      placeName: string;
      placeType: OrganolepticPlaceType;
      items: OrganolepticChecklistWithItems["items"];
    }
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
    safeCount: group.items.filter((i) => i.safety === OrganolepticSafety.AMAN)
      .length,
    unsafeCount: group.items.filter(
      (i) => i.safety === OrganolepticSafety.TIDAK_AMAN
    ).length,
    avgOverall: averageScores(group.items).overall,
  }));
}

function buildSummaryFromChecklists(
  dateStr: string,
  checklists: OrganolepticChecklistWithItems[],
  dateEnd?: string
): OrganolepticDailySummary {
  const allItems = checklists.flatMap((c) => c.items);
  const safeCount = allItems.filter(
    (i) => i.safety === OrganolepticSafety.AMAN
  ).length;
  const unsafeCount = allItems.filter(
    (i) => i.safety === OrganolepticSafety.TIDAK_AMAN
  ).length;
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

const publicChecklistSelect = {
  placeName: true,
  placeType: true,
  inspectionDate: true,
  createdAt: true,
  items: {
    select: {
      tasteScore: true,
      colorScore: true,
      aromaScore: true,
      textureScore: true,
      safety: true,
    },
  },
};

async function buildPublicViewForDay(
  dateStr: string
): Promise<OrganolepticPublicView> {
  const trendWindow = resolveTrendWindow(dateStr);
  const trendFrom = parseInspectionDate(trendWindow.from)!;
  const trendTo = parseInspectionDate(trendWindow.to)!;
  const gte = trendFrom <= trendTo ? trendFrom : trendTo;
  const lte = trendFrom <= trendTo ? trendTo : trendFrom;

  const checklists = await prisma.organolepticChecklist.findMany({
    where: { inspectionDate: { gte, lte } },
    select: publicChecklistSelect,
    orderBy: [{ inspectionDate: "desc" }, { createdAt: "desc" }],
  });

  const dayChecklists = checklists.filter(
    (c) => formatInspectionDateInput(c.inspectionDate) === dateStr
  );

  return {
    summary: buildSummaryFromChecklists(dateStr, dayChecklists),
    recentPlaces: buildPlaceSummaries(dayChecklists),
    unsafeTrend: buildUnsafeTrendFromChecklists(
      checklists,
      trendWindow.from,
      trendWindow.to
    ),
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
    select: publicChecklistSelect,
    orderBy: [{ inspectionDate: "desc" }, { createdAt: "desc" }],
  });

  const trendWindow = resolveTrendWindow(fromStr, toStr);

  return {
    summary: buildSummaryFromChecklists(fromStr, checklists, toStr),
    recentPlaces: buildPlaceSummaries(checklists),
    unsafeTrend: buildUnsafeTrendFromChecklists(
      checklists,
      trendWindow.from,
      trendWindow.to
    ),
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
  if (filter?.dateFrom && filter?.dateTo) {
    return buildPublicViewForRange(filter.dateFrom, filter.dateTo);
  }

  if (filter?.date) {
    return buildPublicViewForDay(filter.date);
  }

  const today = formatInspectionDateInput(new Date());
  const todayDate = parseInspectionDate(today)!;

  const [todayCount, latest] = await Promise.all([
    prisma.organolepticChecklist.count({
      where: { inspectionDate: todayDate },
    }),
    prisma.organolepticChecklist.findFirst({
      orderBy: { inspectionDate: "desc" },
      select: { inspectionDate: true },
    }),
  ]);

  if (!latest) return emptyPublicView();

  const dateStr =
    todayCount > 0
      ? today
      : formatInspectionDateInput(latest.inspectionDate);

  return buildPublicViewForDay(dateStr);
}
