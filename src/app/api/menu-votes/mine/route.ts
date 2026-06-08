import { NextResponse } from "next/server";
import { getFavoritedMenuItemIds, getVoterKeyFromCookies } from "@/lib/menu-vote";

export async function GET() {
  try {
    const voterKey = await getVoterKeyFromCookies();
    const favoritedIds = await getFavoritedMenuItemIds(voterKey);
    return NextResponse.json({ favoritedIds });
  } catch {
    return NextResponse.json({ favoritedIds: [] });
  }
}
