import { NextResponse } from "next/server";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) return notFound();

    if (body.reply) {
      const reply = await prisma.comment.create({
        data: {
          content: (body.reply as string).trim(),
          guestName: "Admin SPPG",
          isApproved: true,
          articleId: existing.articleId,
          parentId: id,
          authorId: session!.user.id,
        },
      });
      return NextResponse.json(reply);
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        isApproved: body.isApproved !== undefined ? Boolean(body.isApproved) : existing.isApproved,
      },
    });

    return NextResponse.json(comment);
  } catch {
    return serverError("Gagal memperbarui komentar");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound();
  }
}
