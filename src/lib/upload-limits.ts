/** Shared upload limits — aman diimpor client & server (tanpa fs/Blob). */

export const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 8 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 15 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/x-wav",
  "audio/wave",
] as const;

export const ALLOWED_VIDEO_TYPES = ["video/mp4"] as const;

/** MIME yang diizinkan untuk client upload langsung ke Vercel Blob. */
export const BLOB_CLIENT_ALLOWED_CONTENT_TYPES = [
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
] as string[];

export function isAllowedAudioType(type: string): boolean {
  return (ALLOWED_AUDIO_TYPES as readonly string[]).includes(type);
}

export function isAllowedVideoType(type: string): boolean {
  return (ALLOWED_VIDEO_TYPES as readonly string[]).includes(type);
}

export function isBlobClientUploadType(type: string): boolean {
  return isAllowedVideoType(type) || isAllowedAudioType(type);
}

/** Batas byte untuk token client upload (video lebih besar dari audio). */
export function blobClientMaximumSizeInBytes(contentType: string): number {
  if (isAllowedVideoType(contentType)) return MAX_VIDEO_SIZE;
  if (isAllowedAudioType(contentType)) return MAX_AUDIO_SIZE;
  return MAX_IMAGE_SIZE;
}

/** Infer MIME dari ekstensi pathname (saat file.type kosong). */
export function inferMediaContentTypeFromPath(pathname: string): string | undefined {
  const lower = pathname.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  return undefined;
}

/** Batas byte dari pathname upload (ekstensi). */
export function blobClientMaximumSizeFromPath(pathname: string): number {
  const mime = inferMediaContentTypeFromPath(pathname);
  if (!mime) return MAX_VIDEO_SIZE;
  return blobClientMaximumSizeInBytes(mime);
}
