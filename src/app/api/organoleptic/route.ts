import { NextResponse } from "next/server";
import { requireAdmin, badRequest, notFound, serverError } from "@/lib/api-auth";
import {
  createOrganolepticChecklist,
  getOrganolepticChecklists,
  getOrganolepticDailySummary,
} from "@/lib/organoleptic-queries";
import { parseOrganolepticPayload } from "@/lib/organoleptic-validation";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const summary = searchParams.get("summary") === "1";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    if (summary) {
      const data = await getOrganolepticDailySummary(date ?? undefined);
      return NextResponse.json(data);
    }

    const checklists = await getOrganolepticChecklists({
      date: date ?? undefined,
      limit: limit && limit > 0 ? limit : undefined,
    });
    return NextResponse.json(checklists);
  } catch {
    return serverError("Gagal memuat checklist organoleptik");
  }
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = parseOrganolepticPayload(body);
    if ("error" in parsed) return badRequest(parsed.error);

    const checklist = await createOrganolepticChecklist(parsed.data);
    revalidatePublicContent({ organoleptic: true, menu: true });
    return NextResponse.json(checklist, { status: 201 });
  } catch {
    return serverError("Gagal menyimpan checklist organoleptik");
  }
}
