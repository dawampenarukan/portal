import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const name = formData.get("name") as string;
      const email = formData.get("email") as string | null;
      const phone = formData.get("phone") as string | null;
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const category = formData.get("category") as string | null;
      const imagesJson = formData.get("images") as string | null;
      const images = imagesJson ? (JSON.parse(imagesJson) as string[]) : [];

      if (!name?.trim() || !title?.trim() || !description?.trim()) {
        return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
      }

      const feedback = await prisma.feedback.create({
        data: {
          name: name.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          title: title.trim(),
          description: description.trim(),
          category: category?.trim() || null,
          images,
        },
      });

      return NextResponse.json({ id: feedback.id }, { status: 201 });
    }

    const body = await request.json();
    const { name, email, phone, title, description, category, images } = body as {
      name?: string;
      email?: string;
      phone?: string;
      title?: string;
      description?: string;
      category?: string;
      images?: string[];
    };

    if (!name?.trim() || !title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        title: title.trim(),
        description: description.trim(),
        category: category?.trim() || null,
        images: images ?? [],
      },
    });

    return NextResponse.json({ id: feedback.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan masukan" }, { status: 500 });
  }
}
