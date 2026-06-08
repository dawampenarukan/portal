import { NextResponse } from "next/server";
import { requireAdmin, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { revalidatePublicContent } from "@/lib/revalidate-public";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return notFound();
  return NextResponse.json(event);
}

export async function PATCH(request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return notFound();

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? existing.title,
        slug: body.slug?.trim() || (body.title ? slugify(body.title) : existing.slug),
        description:
          body.description !== undefined ? body.description?.trim() || null : existing.description,
        location: body.location?.trim() ?? existing.location,
        startAt: body.startAt ? new Date(body.startAt) : existing.startAt,
        endAt: body.endAt !== undefined ? (body.endAt ? new Date(body.endAt) : null) : existing.endAt,
        coverImage: body.coverImage !== undefined ? body.coverImage || null : existing.coverImage,
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished,
      },
    });

    revalidatePublicContent({ events: true });

    return NextResponse.json(event);
  } catch {
    return serverError("Gagal memperbarui event");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.event.delete({ where: { id } });
    revalidatePublicContent({ events: true });
    return NextResponse.json({ ok: true });
  } catch {
    return notFound();
  }
}
