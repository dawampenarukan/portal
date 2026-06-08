import { NextResponse } from 'next/server';
import { isLocalDatabaseUrl } from '@/lib/safe-db';
import { hasBlobStorage } from '@/lib/upload';
import { prisma } from '@/lib/prisma';

function checkAuthUrl(): string | undefined {
  const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? '';
  if (!url) return 'NEXTAUTH_URL belum di-set';
  if (
    process.env.VERCEL &&
    (url.includes('localhost') || url.includes('127.0.0.1'))
  ) {
    return 'NEXTAUTH_URL masih localhost — ganti ke https://portalpenarukan2.vercel.app';
  }
  return undefined;
}

export async function GET() {
  const authUrlIssue = checkAuthUrl();
  const checks: Record<string, string> = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
        ? 'set'
        : 'missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'missing',
    BLOB_READ_WRITE_TOKEN: hasBlobStorage() ? 'set' : 'missing',
    VERCEL_URL: process.env.VERCEL_URL ?? 'n/a',
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        checks,
        error: 'DATABASE_URL belum di-set di Vercel Environment Variables',
      },
      { status: 503 }
    );
  }

  if (process.env.VERCEL && isLocalDatabaseUrl()) {
    return NextResponse.json(
      {
        ok: false,
        checks,
        error:
          'DATABASE_URL masih localhost — ganti dengan URL PostgreSQL cloud (Neon/Supabase)',
      },
      { status: 503 }
    );
  }

  if (authUrlIssue && process.env.VERCEL) {
    return NextResponse.json(
      {
        ok: false,
        checks,
        error: authUrlIssue,
        hint: 'Vercel → Settings → Environment Variables → NEXTAUTH_URL = https://portalpenarukan2.vercel.app',
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    const admin = await prisma.user.findUnique({
      where: { email: 'admin@sppgpenarukan2.id' },
      select: { id: true, email: true },
    });

    return NextResponse.json({
      ok: true,
      checks,
      database: 'connected',
      adminExists: !!admin,
      blobReady: hasBlobStorage(),
      blobHint: hasBlobStorage()
        ? 'Upload gambar siap'
        : 'Blob belum connect — Storage → portalpenarukan2-blob → Connect Project → Redeploy',
      adminHint: admin
        ? 'Admin tersedia — login dengan admin@sppgpenarukan2.id / admin123'
        : 'Admin belum ada — jalankan: npm run db:ensure-admin',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        checks,
        error: message,
        hint: 'Jalankan: npx prisma db push && npx prisma db seed (dengan DATABASE_URL production)',
      },
      { status: 503 }
    );
  }
}
