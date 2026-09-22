import { NextResponse } from "next/server";
import { badRequest, requireAdmin } from "@/lib/api-auth";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  isAllowedAudioType,
  isAllowedVideoType,
} from "@/lib/upload-limits";
import { saveUploadedFiles } from "@/lib/upload";

/**
 * Multipart upload (admin).
 * - Gambar: selalu lewat sini (kompres client ≤4MB).
 * - Video/audio: di Vercel ditolak (pakai /api/upload/blob → client direct).
 *   Di lokal diizinkan sebagai fallback saat BLOB_READ_WRITE_TOKEN belum ada
 *   (`npm run env:blob` untuk cloud seperti production).
 */
export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) return badRequest("Tidak ada file");

    const onVercel = Boolean(process.env.VERCEL);

    for (const file of files) {
      const type = (file.type || "").toLowerCase();
      const looksImage =
        (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type) ||
        type.startsWith("image/") ||
        (!type && /\.(jpe?g|png|gif|webp)$/i.test(file.name));
      const looksVideo =
        isAllowedVideoType(type) ||
        type.startsWith("video/") ||
        (!type && /\.mp4$/i.test(file.name));
      const looksAudio =
        isAllowedAudioType(type) ||
        type.startsWith("audio/") ||
        (!type && /\.(mp3|ogg|wav|webm)$/i.test(file.name));

      if (looksVideo || looksAudio) {
        if (onVercel) {
          return badRequest(
            "Video/audio harus diunggah lewat jalur cloud (form berita → Blob). Jangan kirim MP4 ke /api/upload di production."
          );
        }
        if (looksVideo) {
          const okType =
            !type ||
            (ALLOWED_VIDEO_TYPES as readonly string[]).includes(type) ||
            type === "video/mp4";
          if (!okType) {
            return badRequest("Format video hanya MP4");
          }
        }
        continue;
      }
      if (!looksImage) {
        return badRequest(
          "Format tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF."
        );
      }
    }

    const urls = await saveUploadedFiles(files);
    return NextResponse.json({ urls });
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : "Gagal upload");
  }
}
