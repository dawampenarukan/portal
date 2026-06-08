import { NextResponse } from "next/server";
import { FeedbackStatus } from "@prisma/client";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.menuRequest.findUnique({ where: { id } });
    if (!existing) return notFound();

    const request_ = await prisma.menuRequest.update({
      where: { id },
      data: {
        status: (body.status as FeedbackStatus) ?? existing.status,
        menuItemId: body.menuItemId !== undefined ? body.menuItemId || null : existing.menuItemId,
      },
    });

    return NextResponse.json(request_);
  } catch {
    return serverError("Gagal memperbarui request menu");
  }
}
