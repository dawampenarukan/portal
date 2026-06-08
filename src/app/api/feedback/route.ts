import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateFeedbackForm } from "@/lib/feedback-form";

function validationError(errors: Record<string, string>) {
  const first = Object.values(errors)[0];
  return NextResponse.json({ error: first, errors }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const name = (formData.get("name") as string) ?? "";
      const email = (formData.get("email") as string) ?? "";
      const phone = (formData.get("phone") as string) ?? "";
      const title = (formData.get("title") as string) ?? "";
      const description = (formData.get("description") as string) ?? "";
      const category = (formData.get("category") as string) ?? "";
      const imagesJson = formData.get("images") as string | null;
      const images = imagesJson ? (JSON.parse(imagesJson) as string[]) : [];

      const errors = validateFeedbackForm({ name, email, phone, category, title, description });
      if (Object.keys(errors).length > 0) return validationError(errors);

      const feedback = await prisma.feedback.create({
        data: {
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          images,
        },
      });

      return NextResponse.json({ id: feedback.id }, { status: 201 });
    }

    const body = await request.json();
    const { name = "", email = "", phone = "", title = "", description = "", category = "", images } =
      body as {
        name?: string;
        email?: string;
        phone?: string;
        title?: string;
        description?: string;
        category?: string;
        images?: string[];
      };

    const errors = validateFeedbackForm({ name, email, phone, category, title, description });
    if (Object.keys(errors).length > 0) return validationError(errors);

    const feedback = await prisma.feedback.create({
      data: {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        images: images ?? [],
      },
    });

    return NextResponse.json({ id: feedback.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan masukan" }, { status: 500 });
  }
}
