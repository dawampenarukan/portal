import { NextResponse } from 'next/server';
import { getDatabaseInfo, isLocalDatabaseUrl } from '@/lib/safe-db';
import { getSchemaStatus } from '@/lib/db-schema-sync';
import {
  getBlobTokenMisconfigHint,
  getBlobTokenStatus,
  hasBlobStorage,
} from '@/lib/upload';
import { prisma } from '@/lib/prisma';

function checkAuthUrl(): string | undefined {
  const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? '';
  if (!url) return 'NEXTAUTH_URL belum di-set';
  if (
    process.env.VERCEL &&
    (url.includes('localhost') || url.includes('127.0.0.1'))
  ) {
    return 'NEXTAUTH_URL masih localhost — ganti ke https://sppgpenarukan2.vercel.app';
  }
  return undefined;
}

export async function GET(request: Request) {
  const authUrlIssue = checkAuthUrl();
  const dbInfo = getDatabaseInfo();
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const isNeonHost = databaseUrl.includes('neon.tech');
  const usesNeonPooler = databaseUrl.includes('-pooler');
  const hasConnectionLimit = /[?&]connection_limit=/.test(databaseUrl);
  const includeSchema =
    new URL(request.url).searchParams.get('schema') === '1';

  const checks: Record<string, string> = {
    NODE_ENV: process.env.NODE_ENV ?? 'unknown',
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    DIRECT_URL: process.env.DIRECT_URL ? 'set' : 'missing',
    DATABASE_HOST: dbInfo.host,
    DATABASE_NAME: dbInfo.database,
    DATABASE_LOCAL: dbInfo.isLocal ? 'yes' : 'no',
    DATABASE_POOLER:
      !isNeonHost || dbInfo.isLocal
        ? 'n/a'
        : usesNeonPooler
          ? 'yes'
          : 'no',
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
        ? 'set'
        : 'missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'missing',
    BLOB_READ_WRITE_TOKEN: getBlobTokenStatus(),
    VERCEL_URL: process.env.VERCEL_URL ?? 'n/a',
  };

  const performanceHints: string[] = [];
  if (process.env.VERCEL && isNeonHost && !usesNeonPooler) {
    performanceHints.push(
      'DATABASE_URL Neon belum pooled — ganti ke connection string -pooler agar cold start lebih cepat'
    );
  }
  if (process.env.VERCEL && isNeonHost && usesNeonPooler && !hasConnectionLimit) {
    performanceHints.push(
      'Tambahkan connection_limit=1 pada DATABASE_URL pooled (disarankan untuk serverless)'
    );
  }
  const directUrl = process.env.DIRECT_URL ?? '';
  if (process.env.VERCEL && !directUrl) {
    performanceHints.push(
      'DIRECT_URL belum di-set di Vercel — set Neon Direct (tanpa -pooler) agar npm run env:pull / db:deploy aman'
    );
  }
  if (process.env.VERCEL && directUrl.includes('-pooler')) {
    performanceHints.push(
      'DIRECT_URL masih memakai -pooler — ganti ke Neon Direct untuk prisma db push'
    );
  }

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
        hint: 'Vercel → Settings → Environment Variables → NEXTAUTH_URL = https://sppgpenarukan2.vercel.app',
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

    const [articleCount, surveyCount, surveyResponseCount, publicationCount] =
      await Promise.all([
        prisma.article.count(),
        prisma.survey.count(),
        prisma.surveyResponse.count(),
        prisma.publication.count({ where: { type: 'SURVEY_RESULT' } }),
      ]);

    const [weeklyMenuEmojiReady, menuItemVoteReady] = await Promise.all([
      prisma.weeklyMenuEntry
        .findFirst({ select: { id: true, emoji: true } })
        .then(() => true)
        .catch(() => false),
      prisma.menuItemVote
        .findFirst({ select: { id: true } })
        .then(() => true)
        .catch(() => false),
    ]);

    // Catalog/schema check opsional — hindari cost di setiap health ping (Fase 2)
    const schema = includeSchema
      ? await getSchemaStatus().catch(() => null)
      : undefined;

    return NextResponse.json({
      ok: true,
      checks,
      database: 'connected',
      databaseHost: dbInfo.host,
      databaseName: dbInfo.database,
      isLocalDatabase: dbInfo.isLocal,
      ...(includeSchema
        ? {
            schema,
            schemaHint: schema?.ready
              ? 'Schema lengkap'
              : 'Schema belum lengkap — buka /admin/akun → Perbarui Schema Database',
          }
        : {
            schemaHint:
              'Tambahkan ?schema=1 untuk cek kelengkapan schema organoleptik',
          }),
      performanceHints,
      counts: {
        articles: articleCount,
        surveys: surveyCount,
        surveyResponses: surveyResponseCount,
        surveyPublications: publicationCount,
      },
      menuSchema: {
        weeklyMenuEmojiColumn: weeklyMenuEmojiReady,
        menuItemVoteTable: menuItemVoteReady,
      },
      adminExists: !!admin,
      blobReady: hasBlobStorage(),
      blobHint: hasBlobStorage()
        ? 'Upload gambar siap'
        : (getBlobTokenMisconfigHint() ??
          'Blob belum connect — Storage → Blob Store → Connect Project → Redeploy (token harus vercel_blob_rw_...)'),
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
        hint: 'Jalankan: npm run db:deploy && npm run db:seed (butuh DIRECT_URL = Neon direct)',
      },
      { status: 503 }
    );
  }
}
