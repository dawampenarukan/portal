import { NextResponse } from "next/server";
import { MenuCategoryType } from "@prisma/client";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as MenuCategoryType | null;

  const entries = await prisma.weeklyMenuEntry.findMany({
    where: category ? { category } : undefined,
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { category, dayLabel, menuText, sortOrder, isActive } = body as Record<string, unknown>;

    if (!category || !dayLabel || !menuText) {
      return badRequest("Kategori, hari, dan menu wajib diisi");
    }

    const entry = await prisma.weeklyMenuEntry.create({
      data: {
        category: category as MenuCategoryType,
        dayLabel: (dayLabel as string).trim(),
        menuText: (menuText as string).trim(),
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return serverError("Gagal membuat jadwal menu");
  }
}
