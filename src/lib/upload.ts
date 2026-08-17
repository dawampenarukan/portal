import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 15 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-wav",
  "audio/wave",
];

const ALLOWED_VIDEO_TYPES = ["video/mp4"];

/** Official Vercel Blob RW token prefix (`vercel_blob_rw_<storeId>_<secret>`). */
const BLOB_TOKEN_PREFIX = "vercel_blob_rw_";

function isAudioType(type: string): boolean {
  return ALLOWED_AUDIO_TYPES.includes(type) || type.startsWith("audio/");
}

function isAllowedAudioType(type: string): boolean {
  if (ALLOWED_AUDIO_TYPES.includes(type)) return true;
  // Beberapa browser mengirim audio/mp4 untuk m4a — tolak; hanya daftar di atas
  return false;
}

const VIDEO_CLOUD_SETUP_HINT =
  "Upload cloud belum siap untuk video. Minta teknis menjalankan sekali: npm run env:blob — lalu restart npm run dev. " +
  "Atau upload cover langsung dari admin di website live (production sudah terhubung cloud).";

function validateFile(file: File) {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("Ukuran gambar maksimal 5MB");
    }
    return;
  }

  if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error("Ukuran video MP4 maksimal 15MB");
    }
    if (!hasBlobStorage()) {
      throw new Error(VIDEO_CLOUD_SETUP_HINT);
    }
    return;
  }

  if (isAllowedAudioType(file.type)) {
    if (file.size > MAX_AUDIO_SIZE) {
      throw new Error("Ukuran audio maksimal 8MB");
    }
    return;
  }

  if (isAudioType(file.type)) {
    throw new Error("Format audio tidak didukung (MP3, OGG, WAV, WEBM)");
  }

  throw new Error(
    "Format tidak didukung. Gambar: JPEG, PNG, WebP, GIF. Video: MP4. Audio: MP3, OGG, WAV, WEBM."
  );
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
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `uploads/${randomUUID()}.${ext}`;
  const token = getBlobToken();

  if (!token) {
    throw new Error(getBlobTokenMisconfigHint() ?? BLOB_SETUP_HINT);
  }

  const blob = await put(filename, file, {
    access: "public",
    token,
    contentType: file.type || undefined,
  });

  return blob.url;
}

async function saveToLocal(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}

const BLOB_SETUP_HINT =
  "Upload cloud belum siap. Minta teknis menjalankan: npm run env:blob lalu restart npm run dev. " +
  "Di website live, pastikan Blob Store terhubung ke project Vercel.";

export async function saveUploadedFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  if (files.length > 5) throw new Error("Maksimal 5 file per unggahan");

  const hasVideo = files.some((f) => ALLOWED_VIDEO_TYPES.includes(f.type));

  if (process.env.VERCEL || hasVideo) {
    if (!hasBlobStorage()) {
      throw new Error(
        hasVideo
          ? VIDEO_CLOUD_SETUP_HINT
          : getBlobTokenMisconfigHint() ?? BLOB_SETUP_HINT
      );
    }
  }

  // Token ada → selalu cloud (lokal & production sama). Tanpa token → hanya gambar ke lokal.
  const urls: string[] = [];
  const save = hasBlobStorage() ? saveToBlob : saveToLocal;

  for (const file of files) {
    validateFile(file);
    urls.push(await save(file));
  }

  return urls;
}
