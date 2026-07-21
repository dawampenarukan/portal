import { NextResponse } from "next/server";
import {
  requireOrganolepticAccess,
  badRequest,
  forbidden,
  notFound,
  serverError,
} from "@/lib/api-auth";
import {
  deleteOrganolepticChecklist,
  evaluateOrganolepticChecklist,
  getOrganolepticChecklistById,
  getOrganolepticChecklistOwnership,
} from "@/lib/organoleptic-queries";
import { canModifyOrganolepticChecklist, isFullAdminRole } from "@/lib/roles";
import { revalidatePublicContent } from "@/lib/revalidate-public";

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

export async function PATCH(request: Request, context: RouteContext) {
  const { session, error } = await requireOrganolepticAccess();
  if (error) return error;

  if (!isFullAdminRole(session!.user.role)) {
    return forbidden("Hanya admin yang dapat mengevaluasi temuan");
  }

  const { id } = await context.params;

  try {
    const body = (await request.json().catch(() => null)) as { action?: string } | null;
    if (body?.action !== "evaluate") {
      return badRequest("Aksi tidak valid");
    }

    const ownership = await getOrganolepticChecklistOwnership(id);
    if (!ownership) return notFound("Checklist tidak ditemukan");

    const checklist = await evaluateOrganolepticChecklist(id);
    revalidatePublicContent({ organoleptic: true, menu: true });
    return NextResponse.json(checklist);
  } catch {
    return serverError("Gagal mengevaluasi checklist");
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
    revalidatePublicContent({ organoleptic: true, menu: true });
    return NextResponse.json({ ok: true });
  } catch {
    return serverError("Gagal menghapus checklist");
  }
}
