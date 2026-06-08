import { NextResponse } from "next/server";
import { MenuCategoryType } from "@prisma/client";
import { requireAdmin, badRequest, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as MenuCategoryType | null;

  const items = await prisma.menuItem.findMany({
    where: category ? { category } : undefined,
    orderBy: { votes: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, description, emoji, category, votes, isActive } = body as Record<string, unknown>;

    if (!name || !category) return badRequest("Nama dan kategori wajib diisi");

    const item = await prisma.menuItem.create({
      data: {
        name: (name as string).trim(),
        description: (description as string)?.trim() || null,
        emoji: (emoji as string) || null,
        category: category as MenuCategoryType,
        votes: Number(votes) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return serverError("Gagal membuat menu");
  }
}
