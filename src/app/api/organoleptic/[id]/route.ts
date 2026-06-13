import { NextResponse } from "next/server";
import {
  requireOrganolepticAccess,
  forbidden,
  notFound,
  serverError,
} from "@/lib/api-auth";
import {
  deleteOrganolepticChecklist,
  getOrganolepticChecklistById,
  getOrganolepticChecklistOwnership,
} from "@/lib/organoleptic-queries";
import { canModifyOrganolepticChecklist } from "@/lib/roles";

type RouteContext = { params: Promise<{ id: string }> };

async function assertCanAccessChecklist(
  session: { user: { id: string; role?: string | null } },
  id: string
) {
  const ownership = await getOrganolepticChecklistOwnership(id);
  if (!ownership) return { ok: false as const, response: notFound("Checklist tidak ditemukan") };

  if (!canModifyOrganolepticChecklist(session.user.role, ownership, session.user.id)) {
    return { ok: false as const, response: forbidden("Anda tidak bisa mengakses entri akun lain") };
  }

  return { ok: true as const, ownership };
}

export async function GET(_request: Request, context: RouteContext) {
  const { session, error } = await requireOrganolepticAccess();
  if (error) return error;

  const { id } = await context.params;

  try {
    const access = await assertCanAccessChecklist(session!, id);
    if (!access.ok) return access.response;

    const checklist = await getOrganolepticChecklistById(id);
    if (!checklist) return notFound("Checklist tidak ditemukan");
    return NextResponse.json(checklist);
  } catch {
    return serverError("Gagal memuat checklist");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { session, error } = await requireOrganolepticAccess();
  if (error) return error;

  const { id } = await context.params;

  try {
    const access = await assertCanAccessChecklist(session!, id);
    if (!access.ok) return access.response;

    await deleteOrganolepticChecklist(id);
    return NextResponse.json({ ok: true });
  } catch {
    return serverError("Gagal menghapus checklist");
  }
}
