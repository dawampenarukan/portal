import { NextResponse } from "next/server";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { MENU_CATEGORY_ID_TO_TYPE, type MenuCategoryId } from "@/lib/menu-meta";
import {
  syncAllWeeklyMenusFromInventory,
  syncWeeklyMenuFromInventory,
} from "@/lib/inventory-weekly-menu-sync";

const validCategoryIds = new Set<string>(Object.keys(MENU_CATEGORY_ID_TO_TYPE));

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      categoryId?: string;
      from?: string;
      to?: string;
    };

    const from = body.from?.trim() || undefined;
    const to = body.to?.trim() || undefined;
    if ((from && !to) || (!from && to)) {
      return badRequest("from dan to harus diisi bersamaan (YYYY-MM-DD)");
    }

    if (!body.categoryId || body.categoryId === "all") {
      const results = await syncAllWeeklyMenusFromInventory({ from, to });
      return NextResponse.json({ ok: true, results });
    }

    if (!validCategoryIds.has(body.categoryId)) {
      return badRequest("categoryId tidak valid");
    }

    const result = await syncWeeklyMenuFromInventory(body.categoryId as MenuCategoryId, {
      from,
      to,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal sinkron dari inventory";
    const isConfig =
      msg.includes("INVENTORY_APP_URL") ||
      msg.includes("INVENTORY_API_KEY") ||
      msg.includes("menolak API key") ||
      msg.includes("HTTP 401") ||
      msg.includes("HTTP 403") ||
      msg.includes("HTTP 404");
    if (isConfig) {
      return badRequest(msg);
    }
    console.error("[sync-inventory]", e);
    return serverError(msg);
  }
}
