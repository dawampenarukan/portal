import { MenuCategoryType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { MENU_CATEGORY_ID_TO_TYPE, type MenuCategoryId } from "@/lib/menu-meta";
import { prisma } from "@/lib/prisma";

const validCategoryIds = new Set<string>(Object.keys(MENU_CATEGORY_ID_TO_TYPE));

function parseCategoryId(value: string | null): MenuCategoryId | null {
  if (!value || !validCategoryIds.has(value)) return null;
  return value as MenuCategoryId;
}

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const categoryId = parseCategoryId(new URL(request.url).searchParams.get("category"));
  if (!categoryId) return badRequest("Parameter category wajib diisi");

  try {
    const items = await prisma.menuItem.findMany({
      where: { category: MENU_CATEGORY_ID_TO_TYPE[categoryId] },
      orderBy: [{ votes: "desc" }, { name: "asc" }],
    });
    return NextResponse.json(items);
  } catch {
    return serverError("Gagal memuat menu favorit");
  }
}

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;
  return badRequest("Menu favorit diisi otomatis dari jadwal mingguan");
}
