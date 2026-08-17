/** Helper musik rujukan berita — aman untuk client & server. */

export function parseYoutubeVideoId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id && /^[\w-]{11}$/.test(id) ? id : null;
      }
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/")[2];
        return id && /^[\w-]{11}$/.test(id) ? id : null;
      }
      const v = url.searchParams.get("v");
      return v && /^[\w-]{11}$/.test(v) ? v : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function isYoutubeUrl(rawUrl: string): boolean {
  return parseYoutubeVideoId(rawUrl) !== null;
}

/** Parse "mm:ss", "h:mm:ss", atau angka detik murni → detik (>=0). Kosong → null. */
export function parseTimestampToSeconds(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    return Math.max(0, Number.parseInt(raw, 10));
  }

  const parts = raw.split(":").map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((p) => !/^\d{1,3}$/.test(p))) return null;

  const nums = parts.map((p) => Number.parseInt(p, 10));
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (nums.length === 2) {
    [minutes, seconds] = nums;
  } else {
    [hours, minutes, seconds] = nums;
  }

  if (seconds >= 60 || minutes >= 60) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

export function formatSecondsToTimestamp(total: number | null | undefined): string {
  if (total == null || !Number.isFinite(total) || total < 0) return "";
  const s = Math.floor(total);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${mm.padStart(2, "0")}:${ss}`;
  return `${minutes}:${ss}`;
}

export function buildYoutubeEmbedUrl(
  videoId: string,
  options?: {
    startSec?: number | null;
    endSec?: number | null;
    autoplay?: boolean;
  }
): string {
  const params = new URLSearchParams();
  if (options?.autoplay) {
    params.set("autoplay", "1");
    // Unmuted autoplay sering diblokir; tetap coba + UI Play sebagai fallback
  }
  if (options?.startSec != null && options.startSec >= 0) {
    params.set("start", String(Math.floor(options.startSec)));
  }
  if (
    options?.endSec != null &&
    options.endSec > (options.startSec ?? 0)
  ) {
    params.set("end", String(Math.floor(options.endSec)));
  }
  params.set("rel", "0");
  params.set("modestbranding", "1");
  params.set("playsinline", "1");

  const qs = params.toString();
  return `https://www.youtube.com/embed/${videoId}${qs ? `?${qs}` : ""}`;
}

export function validateBackgroundMusicFields(input: {
  url: string;
  startSec: number | null;
  endSec: number | null;
}): string | null {
  const url = input.url.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "URL musik harus http atau https";
    }
  } catch {
    return "URL musik tidak valid";
  }

  if (input.startSec != null && input.startSec < 0) {
    return "Waktu mulai tidak valid";
  }
  if (
    input.endSec != null &&
    input.startSec != null &&
    input.endSec <= input.startSec
  ) {
    return "Waktu sampai harus lebih besar dari waktu dari";
  }
  if (input.endSec != null && input.startSec == null && input.endSec <= 0) {
    return "Waktu sampai tidak valid";
  }

  return null;
}
