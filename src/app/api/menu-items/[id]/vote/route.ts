import { NextResponse } from "next/server";
import { notFound, serverError } from "@/lib/api-auth";
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

    return NextResponse.json(result);
  } catch {
    return serverError("Gagal menyimpan favorit");
  }
}
