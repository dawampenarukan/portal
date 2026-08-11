import { NextResponse } from "next/server";
import { requireAdmin, requireOrganolepticAccess, badRequest, serverError } from "@/lib/api-auth";
import {
  getOrganolepticFoodTemplateNames,
  normalizeFoodTemplateNames,
  saveOrganolepticFoodTemplateNames,
} from "@/lib/organoleptic-food-template";
import { ORGANOLEPTIC_REQUIRED_ITEMS } from "@/lib/organoleptic-meta";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET() {
  const { error } = await requireOrganolepticAccess();
  if (error) return error;

  try {
    const foodNames = await getOrganolepticFoodTemplateNames();
    return NextResponse.json({ foodNames });
  } catch (e) {
    console.error("[organoleptic/food-template GET]", e);
    return serverError("Gagal memuat template nama makanan");
  }
}

export async function PUT(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = (await request.json().catch(() => null)) as {
      foodNames?: unknown;
    } | null;
    if (!body || !Array.isArray(body.foodNames)) {
      return badRequest("foodNames harus berupa array string");
    }

    const foodNames = normalizeFoodTemplateNames(body.foodNames);
    const filledRequired = foodNames
      .slice(0, ORGANOLEPTIC_REQUIRED_ITEMS)
      .filter((n) => n.length > 0).length;

    if (filledRequired < ORGANOLEPTIC_REQUIRED_ITEMS) {
      return badRequest(
        `Minimal ${ORGANOLEPTIC_REQUIRED_ITEMS} nama makanan wajib diisi (baris 1–${ORGANOLEPTIC_REQUIRED_ITEMS})`
      );
    }

    const saved = await saveOrganolepticFoodTemplateNames(foodNames);
    revalidatePublicContent({ organoleptic: true });
    return NextResponse.json({ ok: true, foodNames: saved });
  } catch (e) {
    console.error("[organoleptic/food-template PUT]", e);
    return serverError("Gagal menyimpan template nama makanan");
  }
}
