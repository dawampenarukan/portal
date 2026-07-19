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

  if (organolepticChecklistTable) {
    const [colRows] = await prisma.$queryRaw<{ created_by: boolean; criticism_images: boolean }[]>`
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
        ) AS criticism_images
    `;
    createdByIdColumn = !!colRows?.created_by;
    criticismImagesColumn = !!colRows?.criticism_images;
  }

  const organolepticEntryRole = !!roleRow?.exists;

  return {
    organolepticEntryRole,
    organolepticChecklistTable,
    createdByIdColumn,
    criticismImagesColumn,
    ready:
      organolepticEntryRole &&
      organolepticChecklistTable &&
      createdByIdColumn &&
      criticismImagesColumn,
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
}

/** Tambah kolom organoleptik yang belum ada — aman dijalankan berulang. */
export async function ensureOrganolepticSchema(): Promise<void> {
  const status = await getSchemaStatus();
  if (!status.organolepticChecklistTable) return;

  // Selalu coba tambah kolom opsional (IF NOT EXISTS) agar field paket ikut ter-sync.
  await addOrganolepticColumns();
}

export async function ensureOrganolepticSchemaOnce(): Promise<void> {
  if (globalForSchema.organolepticSchemaEnsured) return;
  await ensureOrganolepticSchema();
  globalForSchema.organolepticSchemaEnsured = true;
}

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

  const status = await getSchemaStatus();
  if (!status.organolepticChecklistTable) {
    throw new Error(
      "Tabel organoleptik belum ada. Jalankan dari lokal: npm run env:pull && npm run db:deploy"
    );
  }

  if (!status.createdByIdColumn || !status.criticismImagesColumn) {
    await addOrganolepticColumns();
    if (!status.createdByIdColumn) applied.push("OrganolepticChecklist.createdById");
    if (!status.criticismImagesColumn) applied.push("OrganolepticChecklist.criticismImages");
  } else {
    await addOrganolepticColumns();
    applied.push("OrganolepticChecklist.packageColumns");
  }

  return applied;
}
