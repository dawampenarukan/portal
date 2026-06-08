import { NextResponse } from "next/server";
import { isLocalDatabaseUrl } from "@/lib/safe-db";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET ? "set" : "missing",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "set" : "missing",
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, checks, error: "DATABASE_URL belum di-set di Vercel Environment Variables" },
      { status: 503 }
    );
  }

  if (process.env.VERCEL && isLocalDatabaseUrl()) {
    return NextResponse.json(
      {
        ok: false,
        checks,
        error: "DATABASE_URL masih localhost — ganti dengan URL PostgreSQL cloud (Neon/Supabase)",
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, checks, database: "connected" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        checks,
        error: message,
        hint: "Jalankan: npx prisma db push && npx prisma db seed (dengan DATABASE_URL production)",
      },
      { status: 503 }
    );
  }
}
