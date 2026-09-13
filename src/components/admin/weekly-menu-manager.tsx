"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ImagePlus, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MenuIconPicker } from "@/components/admin/menu-icon-picker";
import { DEFAULT_MENU_ICON, normalizeMenuIcon, type MenuFoodIcon } from "@/lib/menu-icons";
import {
  SCHOOL_WEEK_DAYS,
  compareWeeklyEntries,
  formatWeeklyMenuHeading,
  isMenuEntrySchoolTarget,
  sortOrderForDay,
} from "@/lib/week-days";
import type { WeeklyMenuEntryView } from "@/lib/types";
import type { MenuCategoryId } from "@/lib/menu-meta";

interface WeeklyMenuManagerProps {
  categoryId: MenuCategoryId;
  initialEntries: WeeklyMenuEntryView[];
}

function sortEntries(entries: WeeklyMenuEntryView[]) {
  return [...entries].sort(compareWeeklyEntries);
}

export function WeeklyMenuManager({ categoryId, initialEntries }: WeeklyMenuManagerProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(() => sortEntries(initialEntries));
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    dayLabel: string;
    menuText: string;
    description: string;
    imageUrl: string;
    emoji: MenuFoodIcon;
  }>({
    dayLabel: "",
    menuText: "",
    description: "",
    imageUrl: "",
    emoji: DEFAULT_MENU_ICON,
  });

  const usedDays = useMemo(
    () => new Set(entries.map((e) => e.dayLabel.trim().toLowerCase())),
    [entries]
  );

  const availableDays = useMemo(
    () =>
      SCHOOL_WEEK_DAYS.filter(
        (day) =>
          !usedDays.has(day.toLowerCase()) ||
          (editingId &&
            entries.find((e) => e.id === editingId)?.dayLabel.toLowerCase() === day.toLowerCase())
      ),
    [usedDays, editingId, entries]
  );

  async function refresh() {
    const res = await fetch(`/api/weekly-menu?category=${categoryId}`);
    if (res.ok) {
      const data = (await res.json()) as WeeklyMenuEntryView[];
      setEntries(sortEntries(data));
    }
    router.refresh();
  }

  function resetForm() {
    setForm({
      dayLabel: "",
      menuText: "",
      description: "",
      imageUrl: "",
      emoji: DEFAULT_MENU_ICON,
    });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(entry: WeeklyMenuEntryView) {
    setEditingId(entry.id);
    setShowForm(false);
    setForm({
      dayLabel: entry.dayLabel,
      menuText: entry.menuText,
      description: entry.description ?? "",
      imageUrl: entry.imageUrl ?? "",
      emoji: normalizeMenuIcon(entry.emoji),
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !data.urls?.[0]) {
        throw new Error(data.error ?? "Gagal upload gambar");
      }
      setForm((prev) => ({ ...prev, imageUrl: data.urls![0] }));
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : "Gagal upload gambar");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dayLabel || !form.menuText.trim()) return;

    setLoading(true);
    const payload = {
      dayLabel: form.dayLabel,
      menuText: form.menuText.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      emoji: form.emoji,
      sortOrder: sortOrderForDay(form.dayLabel),
    };

    const res = editingId
      ? await fetch(`/api/weekly-menu/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/weekly-menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, ...payload }),
        });

    setLoading(false);
    if (!res.ok) return;
    resetForm();
    await refresh();
  }

  async function toggleActive(entry: WeeklyMenuEntryView) {
    setLoading(true);
    await fetch(`/api/weekly-menu/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !entry.isActive }),
    });
    setLoading(false);
    await refresh();
  }

  async function deleteEntry(id: string) {
    if (!confirm("Hapus jadwal menu ini?")) return;
    setLoading(true);
    await fetch(`/api/weekly-menu/${id}`, { method: "DELETE" });
    setLoading(false);
    if (editingId === id) resetForm();
    await refresh();
  }

  async function syncFromInventory() {
    if (
      !confirm(
        "Muat Menu Minggu Ini dari Rencana Produksi Inventory?\n\nJadwal diganti dari rencana Disetujui/Diproses/Selesai.\n• Senin–Jumat: minggu yang sama\n• Sabtu–Minggu: minggu depan\nDeskripsi & foto yang sudah diunggah tetap dipertahankan per tanggal.\nFavorit lama yang tidak ada di sync akan disembunyikan."
      )
    ) {
      return;
    }
    setLoading(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/weekly-menu/sync-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });
      const data = (await res.json()) as {
        error?: string;
        result?: {
          message?: string;
          daysWritten?: number;
          plansSeen?: number;
          plansUsed?: number;
          menusPruned?: number;
          from?: string;
          to?: string;
        };
      };
      if (!res.ok) {
        setSyncMsg(data.error || "Gagal sinkron dari inventory");
        return;
      }
      const r = data.result;
      if (r?.message) {
        setSyncMsg(r.message);
      } else {
        setSyncMsg(
          `Sinkron selesai — ${r?.daysWritten ?? 0} hari, ${r?.plansUsed ?? 0}/${r?.plansSeen ?? 0} rencana (${r?.from ?? "?"} – ${r?.to ?? "?"})`
        );
      }
      await refresh();
    } catch {
      setSyncMsg("Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  }

  const isFormOpen = showForm || editingId !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Menu Minggu Ini</h3>
          <p className="text-xs text-muted-foreground">
            {entries.length} hari terjadwal · Edit nama ikut mengubah Menu Hari Ini & list publik
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={() => void syncFromInventory()}
            title="Ambil dari Inventory → Food Production → Rencana Produksi"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Dari Inventory
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={availableDays.length === 0 && !showForm}
            onClick={() => {
              setEditingId(null);
              setForm({
                dayLabel: availableDays[0] ?? "",
                menuText: "",
                description: "",
                imageUrl: "",
                emoji: DEFAULT_MENU_ICON,
              });
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Tambah Hari
          </Button>
        </div>
      </div>
      {syncMsg && (
        <p
          className={`rounded-md border px-3 py-2 text-xs ${
            syncMsg.startsWith("Tidak ada") ||
            syncMsg.includes("Gagal") ||
            syncMsg.includes("belum di-set") ||
            syncMsg.includes("menolak API key") ||
            syncMsg.includes("HTTP")
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-border bg-muted/30 text-muted-foreground"
          }`}
          role="status"
        >
          {syncMsg}
        </p>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-medium">
            {editingId ? "Edit Menu Hari" : "Tambah Menu Hari"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Hari</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.dayLabel}
                onChange={(e) => setForm({ ...form, dayLabel: e.target.value })}
                required
              >
                <option value="" disabled>
                  Pilih hari
                </option>
                {(editingId
                  ? SCHOOL_WEEK_DAYS.filter(
                      (d) =>
                        availableDays.includes(d) ||
                        d.toLowerCase() === form.dayLabel.toLowerCase()
                    )
                  : availableDays
                ).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Nama menu
              </label>
              <Input
                placeholder="Contoh: Nasi Rendang Telur"
                value={form.menuText}
                onChange={(e) => setForm({ ...form, menuText: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Deskripsi (opsional)
            </label>
            <Textarea
              rows={3}
              placeholder="Detail menu hari ini untuk ditampilkan di halaman publik"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Foto menu (opsional)
            </label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploadingImage || loading}
              onChange={(e) => void handleImageUpload(e)}
            />
            {uploadingImage ? (
              <p className="text-xs text-muted-foreground">Mengunggah foto…</p>
            ) : null}
            {form.imageUrl ? (
              <div className="relative mt-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="Preview foto menu"
                  className="h-28 w-40 rounded-lg border object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: "" })}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label="Hapus foto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImagePlus className="h-3.5 w-3.5" />
                Belum ada foto — akan tampil di Menu Hari Ini
              </p>
            )}
          </div>
          <MenuIconPicker
            value={form.emoji}
            onChange={(emoji: MenuFoodIcon) => setForm({ ...form, emoji })}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading || uploadingImage}>
              {editingId ? "Simpan Perubahan" : "Simpan"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
              Batal
            </Button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada jadwal menu mingguan.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {sortEntries(entries).map((entry) => (
            <li key={entry.id} className="px-3 py-3 sm:px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 gap-3">
                  {entry.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.imageUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg border object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-primary">
                        {formatWeeklyMenuHeading(entry.dayLabel, entry.menuDate)}
                      </p>
                      {isMenuEntrySchoolTarget(entry) ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Target hari ini
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm leading-snug text-foreground">
                      <span className="mr-1 opacity-70" aria-hidden>
                        {normalizeMenuIcon(entry.emoji)}
                      </span>
                      {entry.menuText}
                    </p>
                    {entry.description ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {entry.description}
                      </p>
                    ) : null}
                    <Badge
                      variant={entry.isActive ? "success" : "secondary"}
                      className="text-[10px] font-normal"
                    >
                      {entry.isActive ? "Aktif" : "Disembunyikan"}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 opacity-60 hover:opacity-100">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={loading}
                    onClick={() => startEdit(entry)}
                    aria-label="Edit"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={loading}
                    onClick={() => void toggleActive(entry)}
                    aria-label={entry.isActive ? "Sembunyikan" : "Tampilkan"}
                    title={entry.isActive ? "Sembunyikan" : "Tampilkan"}
                  >
                    {entry.isActive ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 hover:text-destructive"
                    disabled={loading}
                    onClick={() => void deleteEntry(entry.id)}
                    aria-label="Hapus"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
