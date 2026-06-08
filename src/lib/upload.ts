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

/** Vercel injects BLOB_READ_WRITE_TOKEN when Blob Store is connected to the project. */
export function getBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return process.env.BLOB_READ_WRITE_TOKEN;
  }

  // Fallback: named store env vars (e.g. from .env.local tab in Vercel Storage)
  const named = Object.entries(process.env).find(
    ([key, value]) => key.includes("BLOB_READ_WRITE_TOKEN") && value
  );
  return named?.[1];
}

export function hasBlobStorage(): boolean {
  return Boolean(getBlobToken());
}

async function saveToBlob(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `uploads/${randomUUID()}.${ext}`;
  const token = getBlobToken();

  const blob = await put(filename, file, {
    access: "public",
    ...(token ? { token } : {}),
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

const BLOB_SETUP_HINT =
  "Blob Store sudah dibuat tapi belum terhubung ke project. " +
  "Vercel → Storage → portalpenarukan2-blob → Connect Project → pilih project → Redeploy. " +
  "Atau copy BLOB_READ_WRITE_TOKEN dari tab .env.local ke Environment Variables.";

export async function saveUploadedFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  if (files.length > 5) throw new Error("Maksimal 5 gambar");

  if (process.env.VERCEL && !hasBlobStorage()) {
    throw new Error(BLOB_SETUP_HINT);
  }

  const urls: string[] = [];
  const save = hasBlobStorage() ? saveToBlob : saveToLocal;

  for (const file of files) {
    validateFile(file);
    urls.push(await save(file));
  }

  return urls;
}
