/** Client-only helpers: compress photos before POST /api/upload. */

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
    return "Foto terlalu besar. Coba foto dengan resolusi lebih kecil.";
  }
  if (status >= 500) {
    return "Server gagal menerima upload. Coba lagi sebentar.";
  }
  return "Gagal upload gambar";
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
        error: "Foto terlalu besar. Coba foto dengan resolusi lebih kecil.",
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

/** Image → compress; video/audio → raw upload with safe error parsing. */
export async function uploadMediaFile(file: File): Promise<string> {
  const type = (file.type || "").toLowerCase();
  const looksImage =
    type.startsWith("image/") ||
    (!type && /\.(jpe?g|png|gif|webp|hei[cf])$/i.test(file.name));

  if (looksImage) {
    return uploadImageFile(file);
  }

  const urls = await postFiles([file]);
  if (!urls[0]) throw new Error("Gagal mengunggah file");
  return urls[0];
}
