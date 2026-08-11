import { NextResponse } from "next/server";
import { requireAdmin, requireOrganolepticAccess, badRequest, serverError } from "@/lib/api-auth";
import {
  getOrganolepticFoodTemplateNames,
  normalizeFoodTemplateNames,
  saveOrganolepticFoodTemplateNames,
} from "@/lib/organoleptic-food-template";
import {
  ORGANOLEPTIC_REQUIRED_ITEMS,
  formatInspectionDateInput,
  parseInspectionDate,
} from "@/lib/organoleptic-meta";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET(request: Request) {
  const { error } = await requireOrganolepticAccess();
  if (error) return error;

  try {
    const dateParam = new URL(request.url).searchParams.get("date");
    const dateStr =
      dateParam?.trim() || formatInspectionDateInput(new Date());
    if (!parseInspectionDate(dateStr)) {
      return badRequest("Parameter date tidak valid (YYYY-MM-DD)");
    }

    const foodNames = await getOrganolepticFoodTemplateNames(dateStr);
    return NextResponse.json({ menuDate: dateStr, foodNames });
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
      menuDate?: unknown;
      foodNames?: unknown;
    } | null;
    if (!body || !Array.isArray(body.foodNames)) {
      return badRequest("foodNames harus berupa array string");
    }

    const menuDate =
      typeof body.menuDate === "string"
        ? body.menuDate.trim()
        : formatInspectionDateInput(new Date());
    if (!parseInspectionDate(menuDate)) {
      return badRequest("menuDate tidak valid (YYYY-MM-DD)");
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

    const saved = await saveOrganolepticFoodTemplateNames(menuDate, foodNames);
    revalidatePublicContent({ organoleptic: true });
    return NextResponse.json({ ok: true, ...saved });
  } catch (e) {
    console.error("[organoleptic/food-template PUT]", e);
    const msg = e instanceof Error ? e.message : "Gagal menyimpan template nama makanan";
    return serverError(msg);
  }
}
