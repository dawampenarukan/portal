import { NextResponse } from "next/server";
import { parseInspectionDate } from "@/lib/organoleptic-meta";
import { getOrganolepticPublicDisplay } from "@/lib/organoleptic-queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  if (from && to) {
    if (!parseInspectionDate(from) || !parseInspectionDate(to)) {
      return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
    }
  } else if (date && !parseInspectionDate(date)) {
    return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
  }

  try {
    const data = await getOrganolepticPublicDisplay(
      from && to ? { dateFrom: from, dateTo: to } : date ? { date } : undefined
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error("[organoleptic/public] GET error:", err);
    return NextResponse.json({ error: "Gagal memuat data organoleptik" }, { status: 500 });
  }
}
