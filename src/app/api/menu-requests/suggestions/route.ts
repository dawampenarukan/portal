import { NextResponse } from "next/server";
import { getMenuRequestNameSuggestions } from "@/lib/queries";
import { isMenuCategoryId } from "@/lib/menu-meta";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q") ?? "";

  if (!category || !isMenuCategoryId(category)) {
    return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
  }

  if (query.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await getMenuRequestNameSuggestions(category, query);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: "Gagal memuat saran menu" }, { status: 500 });
  }
}
