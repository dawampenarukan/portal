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

    const admin = await prisma.user.findUnique({
      where: { email: "admin@sppgpenarukan2.id" },
      select: { id: true, email: true },
    });

    return NextResponse.json({
      ok: true,
      checks,
      database: "connected",
      adminExists: !!admin,
      adminHint: admin
        ? "Admin tersedia — login dengan admin@sppgpenarukan2.id / admin123"
        : "Admin belum ada — jalankan: npm run db:ensure-admin",
    });
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
