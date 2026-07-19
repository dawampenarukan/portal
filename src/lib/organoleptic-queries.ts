import {
  OrganolepticPlaceType,
  OrganolepticSafety,
  OrganolepticTiming,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureOrganolepticSchemaOnce } from "@/lib/db-schema-sync";
import {
  averageScores,
  eachInspectionDateKeys,
  formatInspectionDateInput,
  formatInspectionTrendLabel,
  normalizeInspectionDateRange,
  parseInspectionDate,
} from "@/lib/organoleptic-meta";

function shiftInspectionDateKey(dateStr: string, deltaDays: number): string {
  const d = parseInspectionDate(dateStr)!;
  const shifted = new Date(d.getTime());
  shifted.setUTCDate(shifted.getUTCDate() + deltaDays);
  return formatInspectionDateInput(shifted);
}
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

async function loadEvaluatedAtMap(ids: string[]): Promise<Map<string, Date | null>> {
  const map = new Map<string, Date | null>();
  if (ids.length === 0) return map;

  const rows = await prisma.$queryRaw<{ id: string; evaluatedAt: Date | null }[]>`
    SELECT "id", "evaluatedAt"
    FROM "OrganolepticChecklist"
    WHERE "id" IN (${Prisma.join(ids)})
  `;
  for (const row of rows) {
    map.set(row.id, row.evaluatedAt);
  }
  return map;
}

export async function getOrganolepticChecklists(options?: {
  date?: string;
  dateEnd?: string;
  limit?: number;
  createdById?: string;
}): Promise<OrganolepticChecklistView[]> {
  await ensureOrganolepticSchemaOnce();
  const rows = await prisma.organolepticChecklist.findMany({
    where: {
      ...inspectionDateFilter(options?.date, options?.dateEnd),
      ...(options?.createdById ? { createdById: options.createdById } : {}),
    },
    include: { items: true, createdBy: { select: { name: true } } },
    orderBy: [{ inspectionDate: "desc" }, { createdAt: "desc" }],
    take: options?.limit,
  });
  const evaluatedMap = await loadEvaluatedAtMap(rows.map((r) => r.id));
  return rows.map((row) =>
    mapChecklist({
      ...row,
      evaluatedAt: evaluatedMap.get(row.id) ?? null,
    })
  );
}

export async function getOrganolepticChecklistById(
  id: string
): Promise<OrganolepticChecklistView | null> {
  await ensureOrganolepticSchemaOnce();
  const row = await prisma.organolepticChecklist.findUnique({
    where: { id },
    include: { items: true, createdBy: { select: { name: true } } },
  });
  if (!row) return null;
  const evaluatedMap = await loadEvaluatedAtMap([id]);
  return mapChecklist({
    ...row,
    evaluatedAt: evaluatedMap.get(id) ?? null,
  });
}

export async function getOrganolepticChecklistOwnership(id: string) {
  return prisma.organolepticChecklist.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });
}

export async function getOrganolepticDailySummary(
  dateInput?: string,
  createdById?: string,
  dateEndInput?: string
): Promise<OrganolepticDailySummary> {
  await ensureOrganolepticSchemaOnce();
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

  const checklists = await prisma.organolepticChecklist.findMany({
    where: {
      ...inspectionDateFilter(range.from, range.to),
      ...(createdById ? { createdById } : {}),
    },
    include: { items: true },
  });

  const allItems = checklists.flatMap((c) => c.items);
  const safeCount = allItems.filter((i) => i.safety === OrganolepticSafety.AMAN).length;
  const unsafeCount = allItems.filter((i) => i.safety === OrganolepticSafety.TIDAK_AMAN).length;
  const avgs = averageScores(allItems);

  return {
    date: range.from,
    dateEnd: range.to !== range.from ? range.to : undefined,
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
    include: { items: true, createdBy: { select: { name: true } } },
  });

  return mapChecklist(row);
}

export async function deleteOrganolepticChecklist(id: string) {
  return prisma.organolepticChecklist.delete({ where: { id } });
}

export async function evaluateOrganolepticChecklist(id: string) {
  await ensureOrganolepticSchemaOnce();

  // Raw SQL: aman meski Prisma Client di proses Next belum reload field baru.
  const updated = await prisma.$executeRaw`
    UPDATE "OrganolepticChecklist"
    SET "evaluatedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
  `;
  if (Number(updated) === 0) {
    throw new Error("Checklist tidak ditemukan");
  }

  const [row] = await prisma.$queryRaw<
    {
      id: string;
      inspectorName: string;
      placeType: OrganolepticPlaceType;
      placeName: string;
      inspectionDate: Date;
      inspectionTime: string;
      timing: OrganolepticTiming;
      packagesReceived: number | null;
      packagesConsumed: number | null;
      packagesReturned: number | null;
      returnReason: string | null;
      criticism: string | null;
      criticismImages: string[];
      evaluatedAt: Date | null;
      createdById: string | null;
      createdAt: Date;
      createdByName: string | null;
    }[]
  >`
    SELECT
      c."id",
      c."inspectorName",
      c."placeType",
      c."placeName",
      c."inspectionDate",
      c."inspectionTime",
      c."timing",
      c."packagesReceived",
      c."packagesConsumed",
      c."packagesReturned",
      c."returnReason",
      c."criticism",
      c."criticismImages",
      c."evaluatedAt",
      c."createdById",
      c."createdAt",
      u."name" AS "createdByName"
    FROM "OrganolepticChecklist" c
    LEFT JOIN "User" u ON u."id" = c."createdById"
    WHERE c."id" = ${id}
  `;

  if (!row) throw new Error("Checklist tidak ditemukan");

  const items = await prisma.organolepticItem.findMany({
    where: { checklistId: id },
    orderBy: { sortOrder: "asc" },
  });

  return mapChecklist({
    ...row,
    createdBy: row.createdByName ? { name: row.createdByName } : null,
    items,
  });
}

export interface OrganolepticAdminNotices {
  unsafeCount: number;
  returnedPackagesCount: number;
}

/** Agregat notice untuk badge navigasi admin — hanya temuan belum dievaluasi. */
export async function getOrganolepticAdminNotices(): Promise<OrganolepticAdminNotices> {
  await ensureOrganolepticSchemaOnce();

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
  const trendWindow = resolveTrendWindow(dateStr);
  const trendFrom = parseInspectionDate(trendWindow.from)!;
  const trendTo = parseInspectionDate(trendWindow.to)!;
  const gte = trendFrom <= trendTo ? trendFrom : trendTo;
  const lte = trendFrom <= trendTo ? trendTo : trendFrom;

  const checklists = await prisma.organolepticChecklist.findMany({
    where: { inspectionDate: { gte, lte } },
    include: { items: true },
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
    include: { items: true },
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
