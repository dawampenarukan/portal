import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format gambar tidak didukung (JPEG, PNG, WebP, GIF)");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran gambar maksimal 5MB");
  }
}

function useBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function saveToBlob(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `uploads/${randomUUID()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

async function saveToLocal(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}

export async function saveUploadedFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  if (files.length > 5) throw new Error("Maksimal 5 gambar");

  if (process.env.VERCEL && !useBlobStorage()) {
    throw new Error(
      "Upload di Vercel memerlukan Vercel Blob. Buka Vercel → Storage → Create Blob Store, lalu redeploy."
    );
  }

  const urls: string[] = [];
  const save = useBlobStorage() ? saveToBlob : saveToLocal;

  for (const file of files) {
    validateFile(file);
    urls.push(await save(file));
  }

  return urls;
}
