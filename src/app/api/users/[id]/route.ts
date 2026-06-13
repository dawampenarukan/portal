import { NextResponse } from "next/server";
import {
  badRequest,
  requireSuperAdmin,
  serverError,
} from "@/lib/api-auth";
import { deleteManageableUser, updateManageableUserPassword } from "@/lib/user-queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";

    if (!password) {
      return badRequest("Password wajib diisi");
    }

    await updateManageableUserPassword(id, password);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengubah password";
    return badRequest(message);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { session, error } = await requireSuperAdmin();
  if (error) return error;

  const { id } = await context.params;

  try {
    await deleteManageableUser(id, session!.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal menghapus akun";
    return badRequest(message);
  }
}
