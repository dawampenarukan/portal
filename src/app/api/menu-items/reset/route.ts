import { NextResponse } from "next/server";
import { requireAdmin, serverError } from "@/lib/api-auth";
import { resetAllMenuFavorites } from "@/lib/menu-sync";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const result = await resetAllMenuFavorites();
    revalidatePublicContent({ menu: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[menu-items/reset]", e);
    return serverError("Gagal mereset menu favorit");
  }
}
