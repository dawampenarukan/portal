import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { badRequest, requireAdmin } from "@/lib/api-auth";
import {
  BLOB_CLIENT_ALLOWED_CONTENT_TYPES,
  blobClientMaximumSizeFromPath,
  inferMediaContentTypeFromPath,
} from "@/lib/upload-limits";
import { getBlobToken, getBlobTokenMisconfigHint, hasBlobStorage } from "@/lib/upload";

/**
 * Token exchange untuk client upload video/audio ke Vercel Blob.
 * Body JSON kecil — tidak kena batas ~4.5MB Function.
 *
 * Auth admin hanya di `onBeforeGenerateToken` (generate token).
 * Event `uploadCompleted` datang dari Vercel tanpa cookie sesi — jangan
 * panggil requireAdmin di puncak handler untuk semua tipe event.
 */
export async function POST(request: Request) {
  if (!hasBlobStorage()) {
    return badRequest(
      getBlobTokenMisconfigHint() ??
        "Upload cloud belum siap. Salin BLOB_READ_WRITE_TOKEN dari Vercel → Storage → Blob Store → tab .env.local ke file .env.local, lalu restart npm run dev. (npm run env:blob sering gagal karena secret [SENSITIVE].)"
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return badRequest("Body permintaan tidak valid");
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: getBlobToken(),
      onBeforeGenerateToken: async (pathname) => {
        // requireAdmin = sesi valid + user masih ada di DB + role full admin
        const { session, error } = await requireAdmin();
        if (error || !session?.user?.id) {
          throw new Error("Sesi admin diperlukan untuk mengunggah video/audio");
        }

        const safePath = pathname.replace(/^\/+/, "");
        if (!safePath.startsWith("uploads/")) {
          throw new Error("Path upload tidak valid");
        }

        const inferred = inferMediaContentTypeFromPath(safePath);
        if (!inferred || (!inferred.startsWith("video/") && !inferred.startsWith("audio/"))) {
          throw new Error("Ekstensi file tidak didukung untuk upload cloud (pakai .mp4 / audio)");
        }

        return {
          allowedContentTypes: BLOB_CLIENT_ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: blobClientMaximumSizeFromPath(safePath),
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async () => {
        // Verified by Blob SDK; no session cookies on this webhook.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[upload:blob]", err);
    const message =
      err instanceof Error ? err.message : "Gagal memproses upload cloud";
    if (/admin diperlukan|not authenticated|unauthorized|forbidden|sesi/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return badRequest(message);
  }
}
