import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Official Vercel Blob RW token prefix (`vercel_blob_rw_<storeId>_<secret>`). */
const BLOB_TOKEN_PREFIX = "vercel_blob_rw_";

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Format gambar tidak didukung (JPEG, PNG, WebP, GIF)");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran gambar maksimal 5MB");
  }
}

export function isValidBlobToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const t = token.trim();
  if (!t) return false;
  // Common misconfig: BLOB_WEBHOOK_PUBLIC_KEY pasted into BLOB_READ_WRITE_TOKEN
  if (
    t.includes("BEGIN PUBLIC KEY") ||
    t.includes("BEGIN PRIVATE KEY") ||
    t.includes("PUBLIC KEY")
  ) {
    return false;
  }
  return t.startsWith(BLOB_TOKEN_PREFIX);
}

function collectBlobTokenCandidates(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (value: string | undefined) => {
    if (!value) return;
    const t = value.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };

  push(process.env.BLOB_READ_WRITE_TOKEN);

  for (const [key, value] of Object.entries(process.env)) {
    if (key.includes("BLOB_READ_WRITE_TOKEN")) {
      push(value);
    }
  }

  return out;
}

/** Detect wrong value pasted into BLOB_READ_WRITE_TOKEN (e.g. webhook public key). */
export function getBlobTokenMisconfigHint(): string | undefined {
  const raw = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!raw) return undefined;
  if (isValidBlobToken(raw)) return undefined;

  if (
    raw.includes("BEGIN PUBLIC KEY") ||
    raw.includes("PUBLIC KEY") ||
    raw.includes("MCowBQYDK2Vw")
  ) {
    return (
      "BLOB_READ_WRITE_TOKEN salah: terisi public key (BLOB_WEBHOOK_PUBLIC_KEY), bukan token upload. " +
      "Vercel → Storage → Blob Store → Connect Project / salin BLOB_READ_WRITE_TOKEN " +
      "(harus diawali vercel_blob_rw_) → Environment Variables → ganti nilai → Redeploy."
    );
  }

  return (
    "BLOB_READ_WRITE_TOKEN tidak valid (harus diawali vercel_blob_rw_). " +
    "Ambil dari Vercel → Storage → Blob Store → tab .env.local, lalu Redeploy."
  );
}

/** Vercel injects BLOB_READ_WRITE_TOKEN when Blob Store is connected to the project. */
export function getBlobToken(): string | undefined {
  for (const candidate of collectBlobTokenCandidates()) {
    if (isValidBlobToken(candidate)) return candidate;
  }
  return undefined;
}

export function hasBlobStorage(): boolean {
  return Boolean(getBlobToken());
}

export type BlobTokenStatus = "ok" | "missing" | "invalid";

export function getBlobTokenStatus(): BlobTokenStatus {
  if (hasBlobStorage()) return "ok";
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return "invalid";
  const named = Object.entries(process.env).some(
    ([key, value]) => key.includes("BLOB_READ_WRITE_TOKEN") && value?.trim()
  );
  return named ? "invalid" : "missing";
}

async function saveToBlob(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `uploads/${randomUUID()}.${ext}`;
  const token = getBlobToken();

  if (!token) {
    throw new Error(getBlobTokenMisconfigHint() ?? BLOB_SETUP_HINT);
  }

  const blob = await put(filename, file, {
    access: "public",
    token,
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
  "Blob Store belum terhubung. " +
  "Vercel → Storage → buat/pilih Blob Store → Connect Project → pilih project ini → Redeploy. " +
  "Token harus diawali vercel_blob_rw_ (bukan public key).";

export async function saveUploadedFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  if (files.length > 5) throw new Error("Maksimal 5 gambar");

  if (process.env.VERCEL) {
    if (!hasBlobStorage()) {
      throw new Error(getBlobTokenMisconfigHint() ?? BLOB_SETUP_HINT);
    }
  }

  const urls: string[] = [];
  const save = hasBlobStorage() ? saveToBlob : saveToLocal;

  for (const file of files) {
    validateFile(file);
    urls.push(await save(file));
  }

  return urls;
}
