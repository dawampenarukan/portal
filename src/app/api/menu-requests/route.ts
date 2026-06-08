import { MenuCategoryType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const validCategories = new Set<string>(Object.values(MenuCategoryType));

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

    return NextResponse.json({ id: menuRequest.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan request menu" }, { status: 500 });
  }
}
