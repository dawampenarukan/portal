import { NextResponse } from "next/server";
import { getMenuDataByCategory } from "@/lib/queries";
import { isMenuCategoryId } from "@/lib/menu-meta";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");
  if (!category || !isMenuCategoryId(category)) {
    return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
  }

  try {
    // Fresh dari DB — dipakai saat ganti tab kategori di client (tanpa hard refresh)
    const data = await getMenuDataByCategory(category);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Gagal memuat menu" }, { status: 500 });
  }
}
