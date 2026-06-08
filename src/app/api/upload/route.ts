import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api-auth";
import { saveUploadedFiles } from "@/lib/upload";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) return badRequest("Tidak ada file");

    const urls = await saveUploadedFiles(files);
    return NextResponse.json({ urls });
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : "Gagal upload");
  }
}
