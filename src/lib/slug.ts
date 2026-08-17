export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Path publik detail berita — slug sudah harus kebab-case. */
export function articlePublicPath(slug: string): string {
  const clean = slugify(slug) || slug.trim();
  return `/berita/${encodeURIComponent(clean)}`;
}
