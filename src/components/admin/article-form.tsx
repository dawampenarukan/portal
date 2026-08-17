"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatSecondsToTimestamp,
  isYoutubeUrl,
  parseTimestampToSeconds,
  validateBackgroundMusicFields,
} from "@/lib/article-background-music";
import { slugify } from "@/lib/slug";
import type { ArticleView } from "@/lib/types";

interface Category {
  id: string;
  name: string;
}

interface ArticleFormProps {
  categories: Category[];
  article?: ArticleView;
}

function isGifUrl(url: string): boolean {
  try {
    const path = new URL(url, "http://local").pathname.toLowerCase();
    return path.endsWith(".gif");
  } catch {
    return /\.gif($|\?)/i.test(url);
  }
}

function isMp4Url(url: string): boolean {
  try {
    const path = new URL(url, "http://local").pathname.toLowerCase();
    return path.endsWith(".mp4");
  } catch {
    return /\.mp4($|\?)/i.test(url);
  }
}

export function ArticleForm({ categories, article }: ArticleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
  const [backgroundAudio, setBackgroundAudio] = useState(
    article?.backgroundAudio ?? ""
  );
  const [backgroundAudioTitle, setBackgroundAudioTitle] = useState(
    article?.backgroundAudioTitle ?? ""
  );
  const [backgroundAudioCredit, setBackgroundAudioCredit] = useState(
    article?.backgroundAudioCredit ?? ""
  );
  const [clipFrom, setClipFrom] = useState(
    formatSecondsToTimestamp(article?.backgroundAudioStartSec)
  );
  const [clipTo, setClipTo] = useState(
    formatSecondsToTimestamp(article?.backgroundAudioEndSec)
  );
  const [categoryId, setCategoryId] = useState(
    article?.categoryId ?? categories[0]?.id ?? ""
  );
  const [status, setStatus] = useState(article?.status ?? "DRAFT");
  const [isPopular, setIsPopular] = useState(article?.isPopular ?? false);
  const [isHighlight, setIsHighlight] = useState(article?.isHighlight ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const startSec = parseTimestampToSeconds(clipFrom);
    const endSec = parseTimestampToSeconds(clipTo);

    if (clipFrom.trim() && startSec == null) {
      setError('Format "Dari" tidak valid (contoh: 0:45 atau 90)');
      setSubmitting(false);
      return;
    }
    if (clipTo.trim() && endSec == null) {
      setError('Format "Sampai" tidak valid (contoh: 1:30 atau 120)');
      setSubmitting(false);
      return;
    }

    const musicError = validateBackgroundMusicFields({
      url: backgroundAudio,
      startSec,
      endSec,
    });
    if (musicError) {
      setError(musicError);
      setSubmitting(false);
      return;
    }

    const hasAudio = Boolean(backgroundAudio.trim());
    const payload = {
      title,
      slug,
      excerpt,
      content,
      coverImage: coverImage || null,
      backgroundAudio: hasAudio ? backgroundAudio.trim() : null,
      backgroundAudioTitle: hasAudio
        ? backgroundAudioTitle.trim() || null
        : null,
      backgroundAudioCredit: hasAudio
        ? backgroundAudioCredit.trim() || null
        : null,
      backgroundAudioStartSec: hasAudio ? startSec : null,
      backgroundAudioEndSec: hasAudio ? endSec : null,
      categoryId,
      status,
      isPopular,
      isHighlight,
    };

    const url = article ? `/api/articles/${article.id}` : "/api/articles";
    const method = article ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan");
      return;
    }

    router.push("/admin/berita");
    router.refresh();
  }

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("files", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        (data as { error?: string }).error ?? "Gagal mengunggah file"
      );
      return null;
    }
    const data = (await res.json()) as { urls?: string[] };
    return data.urls?.[0] ?? null;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError("");
    const url = await uploadFile(file);
    setUploadingCover(false);
    if (url) setCoverImage(url);
    e.target.value = "";
  }

  function clearMusic() {
    setBackgroundAudio("");
    setBackgroundAudioTitle("");
    setBackgroundAudioCredit("");
    setClipFrom("");
    setClipTo("");
  }

  const youtube = isYoutubeUrl(backgroundAudio);

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Judul *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Slug</label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto dari judul (tanpa spasi)"
          onBlur={() => {
            if (slug.trim()) setSlug(slugify(slug));
            else if (title.trim()) setSlug(slugify(title));
          }}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Ringkasan</label>
        <Textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Konten *</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Kategori</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Status</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Cover (gambar atau video MP4)
        </label>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
          onChange={handleCoverUpload}
          disabled={uploadingCover}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG, WebP, GIF (maks. 5MB) atau MP4 (maks. 15MB). Cukup pilih
          file di sini — video akan tampil di website publik otomatis setelah
          tersimpan. Usahakan file ringan.
        </p>
        {coverImage.startsWith("/uploads/") ? (
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <p className="font-medium">Cover lama hanya ada di laptop ini.</p>
            <p className="mt-1 text-amber-900/80">
              Upload ulang file yang sama sekali saja (tombol di atas) agar
              tampil di website publik. Atau unggah langsung dari admin di
              website live.
            </p>
          </div>
        ) : null}
        {uploadingCover && (
          <p className="mt-1 text-xs text-muted-foreground">Mengunggah cover…</p>
        )}
        {coverImage && (
          <div className="mt-3">
            <div className="relative h-32 w-56 overflow-hidden rounded-lg border">
              {isMp4Url(coverImage) ? (
                <video
                  src={coverImage}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : isGifUrl(coverImage) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt="Preview cover"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={coverImage}
                  alt="Preview cover"
                  fill
                  className="object-cover"
                  sizes="224px"
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground break-all">
                {coverImage}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCoverImage("")}
              >
                Hapus cover
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Musik / lagu (rujukan web — opsional)
          </label>
          <Input
            type="url"
            value={backgroundAudio}
            onChange={(e) => setBackgroundAudio(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… atau link Spotify"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Tanpa upload file. Tempel link resmi (YouTube disarankan untuk
            cuplikan menit). Sumber akan ditampilkan sebagai rujukan.
          </p>
          {backgroundAudio.trim() ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {youtube
                ? "YouTube terdeteksi — akan di-embed di halaman detail."
                : "Bukan YouTube — di detail hanya tampil kredit + tombol buka sumber."}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Judul lagu
            </label>
            <Input
              value={backgroundAudioTitle}
              onChange={(e) => setBackgroundAudioTitle(e.target.value)}
              placeholder="Judul karya"
              disabled={!backgroundAudio.trim()}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Sumber / rujukan
            </label>
            <Input
              value={backgroundAudioCredit}
              onChange={(e) => setBackgroundAudioCredit(e.target.value)}
              placeholder="Nama channel / artis / platform"
              disabled={!backgroundAudio.trim()}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Dari (cuplikan)
            </label>
            <Input
              value={clipFrom}
              onChange={(e) => setClipFrom(e.target.value)}
              placeholder="0:45"
              disabled={!backgroundAudio.trim()}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Sampai (cuplikan)
            </label>
            <Input
              value={clipTo}
              onChange={(e) => setClipTo(e.target.value)}
              placeholder="1:30"
              disabled={!backgroundAudio.trim()}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Format mm:ss atau detik. Rentang hanya berlaku untuk embed YouTube.
        </p>

        {backgroundAudio.trim() ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearMusic}>
            Hapus musik / rujukan
          </Button>
        ) : null}
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPopular}
            onChange={(e) => setIsPopular(e.target.checked)}
          />
          Populer
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isHighlight}
            onChange={(e) => setIsHighlight(e.target.checked)}
          />
          Highlight
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting || uploadingCover}>
          {submitting ? "Menyimpan..." : article ? "Perbarui" : "Simpan"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </form>
  );
}
