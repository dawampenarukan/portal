import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { notFound, serverError } from "@/lib/api-auth";
import { MENU_DATA_TAG } from "@/lib/cached-queries";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { ensureVoterKey, toggleMenuItemVote } from "@/lib/menu-vote";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const voterKey = await ensureVoterKey();
    const result = await toggleMenuItemVote(id, voterKey);
    if (!result) return notFound("Menu tidak ditemukan");

    revalidatePublicContent({ menu: true });
    revalidateTag(MENU_DATA_TAG);

    return NextResponse.json(result);
  } catch {
    return serverError("Gagal menyimpan favorit");
  }
}
