function mediaPath(src: string): string {
  try {
    return new URL(src, "http://local").pathname.toLowerCase();
  } catch {
    return src.toLowerCase();
  }
}

export function isArticleImageUrl(src: string): boolean {
  const path = mediaPath(src);
  return (
    /\.(jpe?g|png|gif|webp)($|\?)/i.test(path) ||
    /\.(jpe?g|png|gif|webp)($|\?)/i.test(src)
  );
}

/** Kumpulkan URL gambar unik: cover dulu, lalu URL gambar di teks konten. */
export function collectArticleImages(
  coverImage: string | null | undefined,
  content: string | null | undefined
): string[] {
  const seen = new Set<string>();
  const images: string[] = [];

  function add(url: string) {
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed) || !isArticleImageUrl(trimmed)) return;
    seen.add(trimmed);
    images.push(trimmed);
  }

  if (coverImage) add(coverImage);

  if (content) {
    const pattern =
      /(?:https?:\/\/[^\s<>"']+|\/(?:uploads|media)\/[^\s<>"']+)\.(?:jpe?g|png|gif|webp)(?:\?[^\s<>"']*)?/gi;
    for (const match of content.matchAll(pattern)) {
      add(match[0]);
    }
  }

  return images;
}
