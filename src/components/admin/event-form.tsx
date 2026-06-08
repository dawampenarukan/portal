"use client";

import { ImagePlus, Loader2, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArticleCoverImage } from "@/components/news/article-cover-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface EventFormValues {
  id?: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  coverImage: string | null;
  isPublished: boolean;
}

interface EventFormProps {
  initial?: EventFormValues;
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function EventForm({ initial }: EventFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startAt, setStartAt] = useState(toDatetimeLocalValue(initial?.startAt));
  const [endAt, setEndAt] = useState(toDatetimeLocalValue(initial?.endAt));
  const [coverImage, setCoverImage] = useState<string | null>(initial?.coverImage ?? null);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal upload gambar");
      }
      const data = (await res.json()) as { urls: string[] };
      setCoverImage(data.urls[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload gambar");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!title.trim() || !location.trim() || !startAt) {
      setError("Judul, lokasi, dan waktu mulai wajib diisi");
      setSaving(false);
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || null,
      location: location.trim(),
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : null,
      coverImage,
      isPublished,
    };

    try {
      const url = isEdit ? `/api/events/${initial!.id}` : "/api/events";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal menyimpan event");
      }

      router.push("/admin/event");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !confirm("Hapus event ini?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/events/${initial!.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus event");
      router.push("/admin/event");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Judul Event *</label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Edukasi Gizi Seimbang"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Slug URL</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Kosongkan untuk otomatis dari judul"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Deskripsi</label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan detail kegiatan..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Lokasi *</label>
            <Input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Aula SPPG Penarukan 2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Waktu Mulai *</label>
              <Input
                required
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Waktu Selesai</label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Publikasikan ke portal
          </label>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gambar Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative aspect-video overflow-hidden rounded-xl border">
              <ArticleCoverImage
                src={coverImage}
                alt={title || "Preview event"}
                fill
                fallbackEmoji="🎉"
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploading ? "Mengupload..." : "Upload Gambar"}
              </Button>
              {coverImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoverImage(null)}
                >
                  <X className="h-4 w-4" />
                  Hapus
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP, atau GIF. Maks. 5MB.
            </p>
          </CardContent>
        </Card>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving || uploading}>
          <Save className="h-4 w-4" />
          {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Event"}
        </Button>
        <Link href="/admin/event" prefetch={false}>
          <Button type="button" variant="outline">
            Batal
          </Button>
        </Link>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={handleDelete} disabled={saving}>
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        )}
      </div>
    </form>
  );
}
