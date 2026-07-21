"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ArticleView } from "@/lib/types";

interface Category {
  id: string;
  name: string;
}

interface ArticleFormProps {
  categories: Category[];
  article?: ArticleView;
}

export function ArticleForm({ categories, article }: ArticleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? "");
  const [categoryId, setCategoryId] = useState(
    article?.categoryId ?? categories[0]?.id ?? ""
  );
  const [status, setStatus] = useState(article?.status ?? "DRAFT");
  const [isPopular, setIsPopular] = useState(article?.isPopular ?? false);
  const [isHighlight, setIsHighlight] = useState(article?.isHighlight ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      title,
      slug,
      excerpt,
      content,
      coverImage: coverImage || null,
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

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setCoverImage(data.urls[0] ?? "");
      setError("");
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal upload cover image");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Judul *</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Slug</label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto dari judul" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Ringkasan</label>
        <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Konten *</label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} required />
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
        <label className="mb-1.5 block text-sm font-medium">Cover Image</label>
        <Input type="file" accept="image/*" onChange={handleCoverUpload} />
        {coverImage && (
          <div className="mt-3">
            <div className="relative h-32 w-56 overflow-hidden rounded-lg border">
              <Image
                src={coverImage}
                alt="Preview cover"
                fill
                className="object-cover"
                sizes="224px"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{coverImage}</p>
          </div>
        )}

      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} />
          Populer
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isHighlight} onChange={(e) => setIsHighlight(e.target.checked)} />
          Highlight
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : article ? "Perbarui" : "Simpan"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </form>
  );
}
