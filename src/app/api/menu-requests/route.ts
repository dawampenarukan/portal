import { MenuCategoryType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { MENU_CATEGORY_TYPE_TO_ID } from "@/lib/menu-meta";
import { getMenuDataByCategory } from "@/lib/queries";
import { revalidatePublicContent } from "@/lib/revalidate-public";

const validCategories = new Set<string>(Object.values(MenuCategoryType));

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const category = new URL(request.url).searchParams.get("category");
  const where =
    category && validCategories.has(category)
      ? { category: category as MenuCategoryType }
      : undefined;

  try {
    const requests = await prisma.menuRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch {
    return serverError("Gagal memuat request menu");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requesterName, category, menuName, reason } = body as {
      requesterName?: string;
      category?: string;
      menuName?: string;
      reason?: string;
    };

    if (!requesterName?.trim() || !category || !menuName?.trim()) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    if (!validCategories.has(category)) {
      return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
    }

    const menuRequest = await prisma.menuRequest.create({
      data: {
        requesterName: requesterName.trim(),
        category: category as MenuCategoryType,
        menuName: menuName.trim(),
        reason: reason?.trim() || null,
      },
    });

    revalidatePublicContent({ menu: true });

    const categoryId = MENU_CATEGORY_TYPE_TO_ID[category as MenuCategoryType];
    const { topRequests } = await getMenuDataByCategory(categoryId);

    return NextResponse.json({ id: menuRequest.id, topRequests }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan request menu" }, { status: 500 });
  }
}
