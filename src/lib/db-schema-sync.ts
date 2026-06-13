import { prisma } from "@/lib/prisma";
import type { SchemaStatus } from "@/lib/types";

export type { SchemaStatus };

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

  let createdByIdColumn = false;
  if (tableRow?.exists) {
    const [colRow] = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'OrganolepticChecklist'
          AND column_name = 'createdById'
      ) AS "exists"
    `;
    createdByIdColumn = !!colRow?.exists;
  }

  const organolepticEntryRole = !!roleRow?.exists;
  const organolepticChecklistTable = !!tableRow?.exists;

  return {
    organolepticEntryRole,
    organolepticChecklistTable,
    createdByIdColumn,
    ready:
      organolepticEntryRole &&
      organolepticChecklistTable &&
      createdByIdColumn,
  };
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

  if (status.organolepticChecklistTable && !status.createdByIdColumn) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "OrganolepticChecklist"
      ADD COLUMN IF NOT EXISTS "createdById" TEXT;
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
    applied.push("OrganolepticChecklist.createdById");
  }

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "OrganolepticChecklist"
    ADD COLUMN IF NOT EXISTS "criticismImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  `);
  applied.push("OrganolepticChecklist.criticismImages");

  if (!status.organolepticChecklistTable) {
    throw new Error(
      "Tabel organoleptik belum ada. Jalankan dari lokal: npm run env:pull && npm run db:deploy"
    );
  }

  return applied;
}
