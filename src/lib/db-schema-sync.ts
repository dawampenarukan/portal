import { prisma } from "@/lib/prisma";
import type { SchemaStatus } from "@/lib/types";

export type { SchemaStatus };

const globalForSchema = globalThis as { organolepticSchemaEnsured?: boolean };

export async function getSchemaStatus(): Promise<SchemaStatus> {
  const [roleRow] = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'UserRole' AND e.enumlabel = 'ORGANOLEPTIC_ENTRY'
    ) AS "exists"
  `;

  const [tableRow] = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'OrganolepticChecklist'
    ) AS "exists"
  `;

  const organolepticChecklistTable = !!tableRow?.exists;
  let createdByIdColumn = false;
  let criticismImagesColumn = false;
  let evaluatedAtColumn = false;
  let organolepticItemSafetyIndex = false;

  if (organolepticChecklistTable) {
    const [colRows] = await prisma.$queryRaw<{
      created_by: boolean;
      criticism_images: boolean;
      evaluated_at: boolean;
      safety_idx: boolean;
    }[]>`
      SELECT
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'OrganolepticChecklist'
            AND column_name = 'createdById'
        ) AS created_by,
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'OrganolepticChecklist'
            AND column_name = 'criticismImages'
        ) AS criticism_images,
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'OrganolepticChecklist'
            AND column_name = 'evaluatedAt'
        ) AS evaluated_at,
        EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname = 'OrganolepticItem_safety_idx'
        ) AS safety_idx
    `;
    createdByIdColumn = !!colRows?.created_by;
    criticismImagesColumn = !!colRows?.criticism_images;
    evaluatedAtColumn = !!colRows?.evaluated_at;
    organolepticItemSafetyIndex = !!colRows?.safety_idx;
  }

  const organolepticEntryRole = !!roleRow?.exists;

  return {
    organolepticEntryRole,
    organolepticChecklistTable,
    createdByIdColumn,
    criticismImagesColumn,
    evaluatedAtColumn,
    organolepticItemSafetyIndex,
    ready:
      organolepticEntryRole &&
      organolepticChecklistTable &&
      createdByIdColumn &&
      criticismImagesColumn &&
      evaluatedAtColumn,
  };
}

async function addOrganolepticColumns(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "OrganolepticChecklist"
    ADD COLUMN IF NOT EXISTS "createdById" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "OrganolepticChecklist"
    ADD COLUMN IF NOT EXISTS "criticismImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "OrganolepticChecklist"
    ADD COLUMN IF NOT EXISTS "packagesReceived" INTEGER;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "OrganolepticChecklist"
    ADD COLUMN IF NOT EXISTS "packagesConsumed" INTEGER;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "OrganolepticChecklist"
    ADD COLUMN IF NOT EXISTS "packagesReturned" INTEGER;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "OrganolepticChecklist"
    ADD COLUMN IF NOT EXISTS "returnReason" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "OrganolepticChecklist"
    ADD COLUMN IF NOT EXISTS "evaluatedAt" TIMESTAMP(3);
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'OrganolepticChecklist_createdById_fkey'
      ) THEN
        ALTER TABLE "OrganolepticChecklist"
        ADD CONSTRAINT "OrganolepticChecklist_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "OrganolepticChecklist_createdById_idx"
    ON "OrganolepticChecklist"("createdById");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "OrganolepticChecklist_evaluatedAt_idx"
    ON "OrganolepticChecklist"("evaluatedAt");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "OrganolepticItem_safety_idx"
    ON "OrganolepticItem"("safety");
  `);
}

/**
 * Tambah kolom organoleptik yang belum ada — aman dijalankan berulang.
 * JANGAN panggil dari query/API hot path (cold start Vercel).
 * Pakai lewat syncProductionSchema / POST /api/admin/schema-sync / npm run db:deploy.
 */
export async function ensureOrganolepticSchema(): Promise<void> {
  const status = await getSchemaStatus();
  if (!status.organolepticChecklistTable) return;

  await addOrganolepticColumns();
}

/** Sinkron schema production (admin / script). Satu-satunya jalur DDL runtime yang diizinkan. */
export async function syncProductionSchema(): Promise<string[]> {
  const applied: string[] = [];

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'UserRole' AND e.enumlabel = 'ORGANOLEPTIC_ENTRY'
      ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'ORGANOLEPTIC_ENTRY';
      END IF;
    END $$;
  `);
  applied.push("UserRole.ORGANOLEPTIC_ENTRY");

  const before = await getSchemaStatus();
  if (!before.organolepticChecklistTable) {
    throw new Error(
      "Tabel organoleptik belum ada. Jalankan dari lokal: npm run env:pull && npm run db:deploy"
    );
  }

  // Table sudah dicek — langsung DDL kolom (tanpa getSchemaStatus ekstra)
  await addOrganolepticColumns();

  const after = await getSchemaStatus();
  if (!before.createdByIdColumn && after.createdByIdColumn) {
    applied.push("OrganolepticChecklist.createdById");
  }
  if (!before.criticismImagesColumn && after.criticismImagesColumn) {
    applied.push("OrganolepticChecklist.criticismImages");
  }
  if (!before.evaluatedAtColumn && after.evaluatedAtColumn) {
    applied.push("OrganolepticChecklist.evaluatedAt");
  }
  if (after.organolepticItemSafetyIndex) {
    applied.push("OrganolepticItem.safety_idx");
  }
  applied.push("OrganolepticChecklist.packageColumns");

  globalForSchema.organolepticSchemaEnsured = true;
  return applied;
}
