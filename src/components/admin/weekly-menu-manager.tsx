"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MenuIconPicker } from "@/components/admin/menu-icon-picker";
import { DEFAULT_MENU_ICON, normalizeMenuIcon, type MenuFoodIcon } from "@/lib/menu-icons";
import { WEEK_DAYS, getDaySortOrder, sortOrderForDay } from "@/lib/week-days";
import type { WeeklyMenuEntryView } from "@/lib/types";
import type { MenuCategoryId } from "@/lib/menu-meta";

interface WeeklyMenuManagerProps {
  categoryId: MenuCategoryId;
  initialEntries: WeeklyMenuEntryView[];
}

function sortEntries(entries: WeeklyMenuEntryView[]) {
  return [...entries].sort((a, b) => {
    const dayDiff = getDaySortOrder(a.dayLabel) - getDaySortOrder(b.dayLabel);
    if (dayDiff !== 0) return dayDiff;
    return a.sortOrder - b.sortOrder;
  });
}

export function WeeklyMenuManager({ categoryId, initialEntries }: WeeklyMenuManagerProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(() => sortEntries(initialEntries));
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    dayLabel: string;
    menuText: string;
    emoji: MenuFoodIcon;
  }>({
    dayLabel: "",
    menuText: "",
    emoji: DEFAULT_MENU_ICON,
  });

  const usedDays = useMemo(
    () => new Set(entries.map((e) => e.dayLabel.trim().toLowerCase())),
    [entries]
  );

  const availableDays = useMemo(
    () =>
      WEEK_DAYS.filter(
        (day) =>
          !usedDays.has(day.toLowerCase()) ||
          (editingId &&
            entries.find((e) => e.id === editingId)?.dayLabel.toLowerCase() === day.toLowerCase())
      ),
    [usedDays, editingId, entries]
  );

  async function refresh() {
    router.refresh();
    const res = await fetch(`/api/weekly-menu?category=${categoryId}`);
    if (res.ok) {
      const data = (await res.json()) as WeeklyMenuEntryView[];
      setEntries(sortEntries(data));
    }
  }

  function resetForm() {
    setForm({ dayLabel: "", menuText: "", emoji: DEFAULT_MENU_ICON });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(entry: WeeklyMenuEntryView) {
    setEditingId(entry.id);
    setShowForm(false);
    setForm({
      dayLabel: entry.dayLabel,
      menuText: entry.menuText,
      emoji: normalizeMenuIcon(entry.emoji),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dayLabel || !form.menuText.trim()) return;

    setLoading(true);
    const payload = {
      dayLabel: form.dayLabel,
      menuText: form.menuText.trim(),
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
        "Muat Menu Minggu Ini dari Rencana Produksi Inventory?\n\nJadwal kategori ini diganti dari rencana Disetujui/Diproses/Selesai (minggu ini + minggu depan). Favorit lama yang tidak ada di sync akan disembunyikan."
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
          <p className="text-xs text-muted-foreground">{entries.length} hari terjadwal</p>
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
                  ? WEEK_DAYS.filter(
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
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Menu</label>
              <Input
                placeholder="Contoh: Nasi Rendang Telur"
                value={form.menuText}
                onChange={(e) => setForm({ ...form, menuText: e.target.value })}
                required
              />
            </div>
          </div>
          <MenuIconPicker
            value={form.emoji}
            onChange={(emoji: MenuFoodIcon) => setForm({ ...form, emoji })}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
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
        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-[5rem_1fr_auto] gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Hari</span>
            <span>Menu</span>
            <span className="text-right">Aksi</span>
          </div>
          <div className="divide-y">
            {sortEntries(entries).map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 px-4 py-3"
              >
                <span className="font-semibold text-primary">{entry.dayLabel}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    <span className="mr-1.5">{normalizeMenuIcon(entry.emoji)}</span>
                    {entry.menuText}
                  </p>
                  <Badge
                    variant={entry.isActive ? "success" : "secondary"}
                    className="mt-1 text-[10px]"
                  >
                    {entry.isActive ? "Aktif" : "Disembunyikan"}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => startEdit(entry)}
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() => toggleActive(entry)}
                  >
                    {entry.isActive ? "Sembunyikan" : "Tampilkan"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => deleteEntry(entry.id)}
                    aria-label="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
