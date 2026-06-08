import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articleId, guestName, content } = body as {
      articleId?: string;
      guestName?: string;
      content?: string;
    };

    if (!articleId?.trim() || !guestName?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        articleId,
        guestName: guestName.trim(),
        content: content.trim(),
        isApproved: false,
      },
    });

    return NextResponse.json({ id: comment.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan komentar" }, { status: 500 });
  }
}
