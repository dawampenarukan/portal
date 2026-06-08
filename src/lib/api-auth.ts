import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
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
