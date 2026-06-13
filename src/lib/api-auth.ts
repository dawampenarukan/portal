import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import {
  canAccessOrganoleptic,
  isFullAdminRole,
} from "@/lib/roles";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (!isFullAdminRole(session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

export async function requireOrganolepticAccess() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (!canAccessOrganoleptic(session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

export async function requireSuperAdmin() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (session!.user.role !== UserRole.SUPER_ADMIN) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Tidak ditemukan") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Terjadi kesalahan") {
  return NextResponse.json({ error: message }, { status: 500 });
}
