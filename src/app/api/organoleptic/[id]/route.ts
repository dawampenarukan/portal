import { NextResponse } from "next/server";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import {
  deleteOrganolepticChecklist,
  getOrganolepticChecklistById,
} from "@/lib/organoleptic-queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;

  try {
    const checklist = await getOrganolepticChecklistById(id);
    if (!checklist) return notFound("Checklist tidak ditemukan");
    return NextResponse.json(checklist);
  } catch {
    return serverError("Gagal memuat checklist");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;

  try {
    const existing = await getOrganolepticChecklistById(id);
    if (!existing) return notFound("Checklist tidak ditemukan");
    await deleteOrganolepticChecklist(id);
    return NextResponse.json({ ok: true });
  } catch {
    return serverError("Gagal menghapus checklist");
  }
}
