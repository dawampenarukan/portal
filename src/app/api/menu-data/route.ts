import { NextResponse } from "next/server";
import { getMenuDataByCategoryCached } from "@/lib/cached-queries";
import { isMenuCategoryId } from "@/lib/menu-meta";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");
  if (!category || !isMenuCategoryId(category)) {
    return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
  }

  try {
    const data = await getMenuDataByCategoryCached(category);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal memuat menu" }, { status: 500 });
  }
}
