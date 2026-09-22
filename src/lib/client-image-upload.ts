/** Client-only helpers: compress photos before POST /api/upload; video/audio via Blob client. */

import { upload } from "@vercel/blob/client";
import {
  inferMediaContentTypeFromPath,
  isAllowedAudioType,
  isAllowedVideoType,
  isBlobClientUploadType,
  MAX_AUDIO_SIZE,
  MAX_VIDEO_SIZE,
} from "@/lib/upload-limits";

const MAX_EDGE_PX = 1920;
const TARGET_BYTES = 1.5 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const INITIAL_QUALITY = 0.82;
const MIN_QUALITY = 0.45;

const ALLOWED_INPUT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence"]);

export function uploadErrorMessage(status: number, serverError?: string): string {
  if (serverError?.trim()) return serverError.trim();
  if (status === 413) {
    return "File terlalu besar untuk diunggah lewat server. Untuk video gunakan MP4 maksimal 15MB; untuk foto kompres atau turunkan resolusi.";
  }
  if (status >= 500) {
    return "Server gagal menerima upload. Coba lagi sebentar.";
  }
  return "Gagal upload file";
}

/**
 * Parse upload API body safely. Proxies often return plain text
 * "Request Entity Too Large" (413) which is not JSON.
 */
export async function parseUploadJson(
  res: Response
): Promise<{ urls?: string[]; error?: string }> {
  const text = await res.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as { urls?: string[]; error?: string };
  } catch {
    if (res.status === 413 || /request entity too large/i.test(text)) {
      return {
        error:
          "File terlalu besar untuk diunggah lewat server. Untuk video gunakan MP4 maksimal 15MB; untuk foto kompres atau turunkan resolusi.",
      };
    }
    return {};
  }
}

function baseName(name: string): string {
  const trimmed = name.trim() || "photo";
  const withoutExt = trimmed.replace(/\.[^.]+$/u, "");
  return withoutExt || "photo";
}

function isHeicType(type: string, fileName: string): boolean {
  if (HEIC_TYPES.has(type)) return true;
  return /\.hei[cf]$/i.test(fileName);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Gagal mengompres gambar"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

/**
 * Resize + JPEG compress camera photos so they fit under platform body limits.
 * Small files under the target are returned unchanged when already allowed.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  const type = (file.type || "").toLowerCase();

  if (type && !type.startsWith("image/") && !ALLOWED_INPUT_TYPES.has(type)) {
    throw new Error(
      "Format tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF."
    );
  }

  if (isHeicType(type, file.name)) {
    // Safari often decodes HEIC via createImageBitmap; Chromium often does not.
    // Fall through and convert when possible; fail with a clear tip otherwise.
  } else if (type && !ALLOWED_INPUT_TYPES.has(type) && type.startsWith("image/")) {
    // Other image/* (e.g. bmp) — try decode/convert to JPEG.
  }

  // Keep tiny GIFs as-is (animation); large GIFs still get rasterized to JPEG.
  if (type === "image/gif" && file.size <= TARGET_BYTES) {
    return file;
  }

  if (
    ALLOWED_INPUT_TYPES.has(type) &&
    file.size <= TARGET_BYTES &&
    type !== "image/gif"
  ) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (isHeicType(type, file.name)) {
      throw new Error(
        "Format HEIC tidak didukung di browser ini. Simpan/export sebagai JPEG lalu upload lagi."
      );
    }
    throw new Error(
      "Tidak bisa membaca foto. Coba format JPEG/PNG atau foto lain."
    );
  }

  try {
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Browser tidak mendukung kompresi gambar");
    }
    // Opaque white underlay so transparent PNG → JPEG does not go black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    let quality = INITIAL_QUALITY;
    let blob = await canvasToBlob(canvas, "image/jpeg", quality);

    while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.12);
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }

    if (blob.size > MAX_OUTPUT_BYTES) {
      throw new Error(
        "Foto terlalu besar setelah dikompres. Coba foto dengan resolusi lebih kecil."
      );
    }

    return new File([blob], `${baseName(file.name)}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

async function postFiles(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await parseUploadJson(res);

  if (!res.ok || !data.urls?.length) {
    throw new Error(uploadErrorMessage(res.status, data.error));
  }

  return data.urls;
}

/** Compress then POST multipart to /api/upload; returns first public URL. */
export async function uploadImageFile(file: File): Promise<string> {
  const prepared = await compressImageForUpload(file);
  const urls = await postFiles([prepared]);
  if (!urls[0]) throw new Error("Gagal upload gambar");
  return urls[0];
}

/**
 * Compress each image, then upload one-by-one so total body never exceeds
 * platform limits when many large camera photos are selected.
 */
export async function uploadImageFiles(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadImageFile(file));
  }
  return urls;
}

/** Image → compress + multipart; video/audio → langsung ke Vercel Blob (hindari batas 4.5MB Function). */
export async function uploadMediaFile(file: File): Promise<string> {
  const type = (file.type || "").toLowerCase();
  const looksImage =
    type.startsWith("image/") ||
    (!type && /\.(jpe?g|png|gif|webp|hei[cf])$/i.test(file.name));

  if (looksImage) {
    return uploadImageFile(file);
  }

  const looksVideo =
    isAllowedVideoType(type) || (!type && /\.mp4$/i.test(file.name));
  const looksAudio =
    isAllowedAudioType(type) ||
    (!type && /\.(mp3|ogg|wav|webm)$/i.test(file.name));

  if (looksVideo || looksAudio || isBlobClientUploadType(type)) {
    return uploadLargeMediaToBlob(file);
  }

  throw new Error(
    "Format tidak didukung. Gambar: JPEG, PNG, WebP, GIF. Video: MP4. Audio: MP3, OGG, WAV, WEBM."
  );
}

async function uploadLargeMediaViaMultipart(file: File): Promise<string> {
  const urls = await postFiles([file]);
  if (!urls[0]) throw new Error("Gagal mengunggah file");
  return urls[0];
}

const BLOB_SETUP_HINT =
  "Untuk URL cloud (tampil di production): salin BLOB_READ_WRITE_TOKEN dari Vercel → Storage → Blob Store → tab .env.local, tempel ke .env.local, lalu restart npm run dev. (npm run env:blob sering gagal karena Vercel menyembunyikan secret sebagai [SENSITIVE].)";

async function uploadLargeMediaToBlob(file: File): Promise<string> {
  const type = (file.type || "").toLowerCase();
  const isVideo =
    isAllowedVideoType(type) || (!type && /\.mp4$/i.test(file.name));
  const isAudio =
    isAllowedAudioType(type) ||
    (!type && /\.(mp3|ogg|wav|webm)$/i.test(file.name));

  if (!isVideo && !isAudio) {
    throw new Error(
      "Format tidak didukung. Video: MP4. Audio: MP3, OGG, WAV, WEBM."
    );
  }

  const maxBytes = isVideo ? MAX_VIDEO_SIZE : MAX_AUDIO_SIZE;
  const label = isVideo ? "video MP4" : "audio";
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  if (file.size > maxBytes) {
    throw new Error(`Ukuran ${label} maksimal ${maxMb}MB`);
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase() ||
    (isVideo ? "mp4" : isAudio ? "mp3" : "bin");
  const pathname = `uploads/${crypto.randomUUID()}.${ext}`;
  const contentType =
    file.type ||
    inferMediaContentTypeFromPath(pathname) ||
    (isVideo ? "video/mp4" : isAudio ? "audio/mpeg" : undefined);

  // Pastikan File punya MIME yang dikenali server (browser kadang kosong).
  const uploadFile =
    file.type || !contentType
      ? file
      : new File([file], file.name, {
          type: contentType,
          lastModified: file.lastModified,
        });

  try {
    const blob = await upload(pathname, uploadFile, {
      access: "public",
      handleUploadUrl: "/api/upload/blob",
      contentType,
      multipart: uploadFile.size > 4 * 1024 * 1024,
    });
    if (!blob.url) throw new Error("Gagal mengunggah file");
    return blob.url;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah file";
    if (/unauthorized|forbidden|401|403|sesi admin/i.test(message)) {
      throw new Error("Sesi admin diperlukan untuk mengunggah video/audio.");
    }

    // Jangan andalkan pesan SDK (ada typo spasi ganda di @vercel/blob).
    // Selalu coba multipart: lokal → /uploads; production menolak video di sini.
    try {
      return await uploadLargeMediaViaMultipart(uploadFile);
    } catch (fallbackErr) {
      const fb =
        fallbackErr instanceof Error
          ? fallbackErr.message
          : "Gagal mengunggah file";
      throw new Error(`${fb} — ${BLOB_SETUP_HINT}`);
    }
  }
}
