import { NextResponse } from "next/server";
import {
  requireOrganolepticAccess,
  requireExistingUser,
  badRequest,
  conflict,
  forbidden,
  serverError,
} from "@/lib/api-auth";
import { canAccessOrganoleptic } from "@/lib/roles";
import {
  createOrganolepticChecklist,
  getOrganolepticChecklists,
  getOrganolepticDailySummary,
  getOrganolepticIdForUserDate,
  OrganolepticDuplicateEntryError,
} from "@/lib/organoleptic-queries";
import { getOrganolepticOwnerFilter } from "@/lib/organoleptic-scope";
import { parseOrganolepticPayload } from "@/lib/organoleptic-validation";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET(request: Request) {
  const { session, error } = await requireOrganolepticAccess();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const dateEnd = searchParams.get("dateEnd");
  const summary = searchParams.get("summary") === "1";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const focusParam = searchParams.get("focus");
  const focus =
    focusParam === "unsafe" || focusParam === "returned" ? focusParam : null;
  const safetyParam = searchParams.get("safety");
  const safety =
    safetyParam === "aman" || safetyParam === "tidak-aman" ? safetyParam : null;
  const createdById = getOrganolepticOwnerFilter(session!.user.role, session!.user.id);
  const mineForDate = searchParams.get("mineForDate");

  try {
    if (mineForDate) {
      const existingId = await getOrganolepticIdForUserDate(
        session!.user.id,
        mineForDate
      );
      return NextResponse.json({ existingId });
    }

    if (summary) {
      const data = await getOrganolepticDailySummary(
        date ?? undefined,
        createdById,
        dateEnd ?? undefined
      );
      return NextResponse.json(data);
    }

    const result = await getOrganolepticChecklists({
      date: date ?? undefined,
      dateEnd: dateEnd ?? undefined,
      limit: limit && limit > 0 ? limit : undefined,
      createdById,
      focus,
      safety,
    });
    return NextResponse.json(result);
  } catch {
    return serverError("Gagal memuat checklist organoleptik");
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireExistingUser();
  if (error) return error;

  if (!canAccessOrganoleptic(session!.user.role)) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const parsed = parseOrganolepticPayload(body);
    if ("error" in parsed) return badRequest(parsed.error);

    const checklist = await createOrganolepticChecklist(parsed.data, session!.user.id);
    revalidatePublicContent({ organoleptic: true, menu: true });
    return NextResponse.json(checklist, { status: 201 });
  } catch (err) {
    if (err instanceof OrganolepticDuplicateEntryError) {
      return conflict(err.message, {
        existingId: err.existingId || undefined,
      });
    }
    console.error("[organoleptic] POST error:", err);
    return serverError("Gagal menyimpan checklist organoleptik");
  }
}
