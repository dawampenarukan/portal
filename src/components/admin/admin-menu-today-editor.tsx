"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, RotateCcw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatWeeklyMenuHeading } from "@/lib/week-days";
import type { MenuCategoryId } from "@/lib/menu-meta";
import type { TodayMenuAdminSnapshot } from "@/lib/types";
import { snapshotSyncKey } from "@/lib/menu-today-snapshot-key";
import { uploadImageFile } from "@/lib/client-image-upload";
import { cn } from "@/lib/utils";

interface AdminMenuTodayEditorProps {
  initialSnapshot: TodayMenuAdminSnapshot;
}

function pickPrefill(snapshot: TodayMenuAdminSnapshot) {
  const ymd = snapshot.todayYmd;
  const label = snapshot.dayLabel.trim().toLowerCase();
  const todayEntries = snapshot.categories
    .map((c) => c.entry)
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .filter(
      (e) =>
        e.menuDate === ymd || e.dayLabel.trim().toLowerCase() === label
    );

  // Hanya entri tanggal sasaran (hindari kategori lain “menyeret” deskripsi/foto lama).
  const entry =
    todayEntries.find((e) => e.imageUrl || e.description) ??
    todayEntries.find((e) => e.menuText.trim()) ??
    null;

  if (!entry) {
    return {
      menuText: snapshot.inventoryDefault?.menuText ?? "",
      description: "",
      imageUrl: "",
    };
  }
  return {
    menuText: entry.menuText,
    description: entry.description ?? "",
    imageUrl: entry.imageUrl ?? "",
  };
}

export function AdminMenuTodayEditor({ initialSnapshot }: AdminMenuTodayEditorProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const prefill = useMemo(() => pickPrefill(initialSnapshot), [initialSnapshot]);
  const [menuText, setMenuText] = useState(prefill.menuText);
  const [description, setDescription] = useState(prefill.description);
  const [imageUrl, setImageUrl] = useState(prefill.imageUrl);
  const [selected, setSelected] = useState<Set<MenuCategoryId>>(
    () => new Set(initialSnapshot.categories.map((c) => c.categoryId))
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncKey = useMemo(
    () => snapshotSyncKey(initialSnapshot),
    [initialSnapshot]
  );

  // Setelah sync Inventory / router.refresh(), isi ulang form dari data server.
  useEffect(() => {
    setSnapshot(initialSnapshot);
    const next = pickPrefill(initialSnapshot);
    setMenuText(next.menuText);
    setDescription(next.description);
    setImageUrl(next.imageUrl);
    setSelected(new Set(initialSnapshot.categories.map((c) => c.categoryId)));
    setMessage(null);
    setError(null);
    // Hanya saat data server benar-benar berubah (bukan tiap render object baru).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncKey
  }, [syncKey]);

  const heading = formatWeeklyMenuHeading(snapshot.dayLabel, snapshot.todayYmd);
  const inventoryHint = snapshot.inventoryDefault
    ? `Nama default dari Inventory (${formatWeeklyMenuHeading(
        snapshot.inventoryDefault.dayLabel,
        snapshot.inventoryDefault.menuDate
      )})`
    : snapshot.isWeekendFallback
      ? "Belum ada jadwal Inventory untuk Senin depan — sync dulu atau isi manual."
      : "Belum ada jadwal Inventory untuk hari ini — sync dulu atau isi manual.";

  function toggleCategory(id: MenuCategoryId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleReset() {
    if (selected.size === 0) {
      setError("Pilih minimal satu kategori");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/weekly-menu/today", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset: true,
          categoryIds: Array.from(selected),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        snapshot?: TodayMenuAdminSnapshot;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Gagal reset menu");
      }
      if (data.snapshot) {
        setSnapshot(data.snapshot);
        // Reset = kebalikan Simpan: paksa kosongkan deskripsi & foto di form,
        // nama dari entri kategori yang di-reset (sudah diisi dari Inventory di server).
        const resetName =
          data.snapshot.categories.find(
            (c) => selected.has(c.categoryId) && c.entry?.menuText?.trim()
          )?.entry?.menuText ??
          data.snapshot.inventoryDefault?.menuText ??
          "";
        setMenuText(resetName);
        setDescription("");
        setImageUrl("");
      } else {
        setDescription("");
        setImageUrl("");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal reset menu");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImageFile(file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!menuText.trim()) {
      setError("Nama menu wajib diisi");
      return;
    }
    if (selected.size === 0) {
      setError("Pilih minimal satu kategori");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/weekly-menu/today", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuText: menuText.trim(),
          description: description.trim() || null,
          imageUrl: imageUrl.trim() || null,
          categoryIds: Array.from(selected),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        snapshot?: TodayMenuAdminSnapshot;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Gagal menyimpan");
      }
      if (data.snapshot) {
        setSnapshot(data.snapshot);
        const next = pickPrefill(data.snapshot);
        setMenuText(next.menuText);
        setDescription(next.description);
        setImageUrl(next.imageUrl);
      }
      setMessage(
        `Menu disimpan ke ${selected.size} kategori (${data.snapshot?.dayLabel ?? snapshot.dayLabel}, ${data.snapshot?.todayYmd ?? snapshot.todayYmd}).`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Menu Hari Ini</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit sekali untuk semua kategori. Nama default dari sync Inventory.{" "}
              <span className="font-medium text-foreground">{heading}</span>
              {snapshot.isWeekendFallback ? (
                <span className="mt-0.5 block text-xs">
                  Akhir pekan → mengedit Senin depan (jadwal sekolah berikutnya). Publik
                  menampilkan kartu kosong sampai Senin.
                </span>
              ) : null}
            </p>
          </div>
          <Badge variant="secondary">
            {snapshot.isWeekendFallback ? "Senin depan" : snapshot.dayLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nama menu</label>
                <Input
                  value={menuText}
                  onChange={(e) => setMenuText(e.target.value)}
                  placeholder="Contoh: Nasi Ayam Suwir Sayur"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">{inventoryHint}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Deskripsi (opsional)
                </label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail singkat yang tampil di halaman publik"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Terapkan ke kategori
                </label>
                <div className="flex flex-wrap gap-2">
                  {snapshot.categories.map((cat) => {
                    const checked = selected.has(cat.categoryId);
                    return (
                      <button
                        key={cat.categoryId}
                        type="button"
                        onClick={() => toggleCategory(cat.categoryId)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                          checked
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {cat.emoji} {cat.label}
                        {cat.entry ? "" : " · belum ada"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Foto (opsional)</label>
              <div className="relative overflow-hidden rounded-xl border bg-muted/30">
                {imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Preview menu hari ini"
                      className="aspect-4/3 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                      aria-label="Hapus foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex aspect-4/3 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImagePlus className="h-8 w-8 opacity-60" />
                    <span className="text-xs">Belum ada foto</span>
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading || loading}
                onChange={(e) => void handleImageUpload(e)}
              />
              {uploading ? (
                <p className="text-xs text-muted-foreground">Mengunggah foto…</p>
              ) : null}
            </div>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={loading || uploading}>
              <Save className="h-4 w-4" />
              Simpan Menu Hari Ini
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading || uploading}
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset menu
            </Button>
            <p className="text-xs text-muted-foreground">
              Reset = batalkan Simpan: nama dari Inventory, deskripsi & foto dihapus.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
