/**
 * Validasi URL cover artikel (gambar / video MP4 lokal atau Vercel Blob).
 * Tolak skema berbahaya dan host asing yang tidak dikenal.
 */
export function normalizeArticleCoverImage(
  value: unknown
): { ok: true; url: string | null } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") {
    return { ok: true, url: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "Cover tidak valid" };
  }

  const raw = value.trim();
  if (!raw) return { ok: true, url: null };
  if (raw.length > 2048) {
    return { ok: false, error: "URL cover terlalu panjang" };
  }
  if (/[\s<>"']/.test(raw) || /javascript:/i.test(raw)) {
    return { ok: false, error: "URL cover tidak valid" };
  }

  // Path relatif lokal (dev / legacy)
  if (raw.startsWith("/uploads/")) {
    if (raw.includes("..")) {
      return { ok: false, error: "URL cover tidak valid" };
    }
    return { ok: true, url: raw };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "URL cover tidak valid" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, error: "Cover harus memakai HTTPS atau /uploads/" };
  }

  const host = url.hostname.toLowerCase();
  const isBlobHost =
    host.endsWith(".public.blob.vercel-storage.com") ||
    host.endsWith(".blob.vercel-storage.com");

  if (isBlobHost) {
    // Blob URL harus ekstensi media yang dikenal (hindari object arbitrary)
    const path = url.pathname.toLowerCase();
    if (!/\.(jpe?g|png|gif|webp|mp4)$/.test(path)) {
      return {
        ok: false,
        error: "Cover Blob harus berakhiran .jpg/.png/.gif/.webp/.mp4",
      };
    }
    return { ok: true, url: raw };
  }

  // Legacy HTTPS: hanya host portal sendiri (bukan sembarang CDN)
  const allowedLegacyHosts = new Set([
    "sppgpenarukan2.my.id",
    "www.sppgpenarukan2.my.id",
    "sppgpenarukan2.vercel.app",
  ]);
  const path = url.pathname.toLowerCase();
  if (
    allowedLegacyHosts.has(host) &&
    /\.(jpe?g|png|gif|webp|mp4)$/.test(path)
  ) {
    return { ok: true, url: raw };
  }

  return {
    ok: false,
    error: "Cover hanya boleh dari /uploads/, Vercel Blob, atau domain portal",
  };
}
