import { NextResponse } from "next/server";
import { requireAdmin, badRequest, notFound, serverError } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const events = await prisma.event.findMany({ orderBy: { startAt: "asc" } });
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { title, slug, description, location, startAt, endAt, coverImage, isPublished } =
      body as Record<string, unknown>;

    if (!title || !location || !startAt) {
      return badRequest("Judul, lokasi, dan waktu mulai wajib diisi");
    }

    const event = await prisma.event.create({
      data: {
        title: (title as string).trim(),
        slug: (slug as string)?.trim() || slugify(title as string),
        description: (description as string)?.trim() || null,
        location: (location as string).trim(),
        startAt: new Date(startAt as string),
        endAt: endAt ? new Date(endAt as string) : null,
        coverImage: (coverImage as string) || null,
        isPublished: Boolean(isPublished),
      },
    });

    revalidatePublicContent({ events: true });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return serverError("Gagal membuat event");
  }
}
