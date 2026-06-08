import { NextResponse } from "next/server";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub) return notFound();
  return NextResponse.json(pub);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.publication.findUnique({ where: { id } });
    if (!existing) return notFound();

    const isPublished = body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished;

    const pub = await prisma.publication.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? existing.title,
        slug: body.slug?.trim() || (body.title ? slugify(body.title) : existing.slug),
        summary: body.summary !== undefined ? body.summary?.trim() || null : existing.summary,
        content: body.content ?? existing.content,
        type: body.type ?? existing.type,
        period: body.period?.trim() ?? existing.period,
        chartData: body.chartData !== undefined ? body.chartData : existing.chartData,
        isPublished,
        publishedAt: isPublished
          ? body.publishedAt
            ? new Date(body.publishedAt)
            : existing.publishedAt ?? new Date()
          : null,
      },
    });

    return NextResponse.json(pub);
  } catch {
    return serverError("Gagal memperbarui publikasi");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.publication.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound();
  }
}
