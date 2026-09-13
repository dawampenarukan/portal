import { NextResponse } from "next/server";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { MENU_CATEGORY_ID_TO_TYPE, type MenuCategoryId } from "@/lib/menu-meta";
import {
  getTodayMenuAdminSnapshot,
  resetTodayMenuForCategories,
  upsertTodayMenuForCategories,
} from "@/lib/menu-today-admin";

const validCategoryIds = new Set<string>(Object.keys(MENU_CATEGORY_ID_TO_TYPE));

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const snapshot = await getTodayMenuAdminSnapshot();
    return NextResponse.json(snapshot);
  } catch (e) {
    console.error("[weekly-menu/today GET]", e);
    return serverError("Gagal memuat menu hari ini");
  }
}

export async function PUT(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = (await request.json()) as {
      reset?: boolean;
      menuText?: string;
      description?: string | null;
      imageUrl?: string | null;
      emoji?: string | null;
      categoryIds?: string[];
    };

    const rawIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];
    const categoryIds = rawIds.filter((id): id is MenuCategoryId =>
      validCategoryIds.has(id)
    );
    if (categoryIds.length === 0) {
      return badRequest("Pilih minimal satu kategori");
    }

    if (body.reset === true) {
      const snapshot = await resetTodayMenuForCategories({ categoryIds });
      return NextResponse.json({ ok: true, snapshot, reset: true });
    }

    const menuText = body.menuText?.trim();
    if (!menuText) return badRequest("Nama menu wajib diisi");

    const snapshot = await upsertTodayMenuForCategories({
      menuText,
      description: body.description,
      imageUrl: body.imageUrl,
      emoji: body.emoji,
      categoryIds,
    });

    return NextResponse.json({ ok: true, snapshot });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal menyimpan menu hari ini";
    if (
      msg.includes("wajib") ||
      msg.includes("Pilih") ||
      msg.includes("Tidak ada nama")
    ) {
      return badRequest(msg);
    }
    console.error("[weekly-menu/today PUT]", e);
    return serverError(msg);
  }
}
