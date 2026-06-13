import { NextResponse } from "next/server";
import { badRequest, requireSuperAdmin, serverError } from "@/lib/api-auth";
import { getSchemaStatus, syncProductionSchema } from "@/lib/db-schema-sync";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    const schema = await getSchemaStatus();
    return NextResponse.json(schema);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal cek schema";
    return serverError(message);
  }
}

export async function POST() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  try {
    const applied = await syncProductionSchema();
    const schema = await getSchemaStatus();
    return NextResponse.json({
      ok: true,
      applied,
      schema,
      message: "Schema database berhasil diperbarui",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal sinkron schema";
    return badRequest(message);
  }
}
