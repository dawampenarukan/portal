"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type SyncResultRow = {
  categoryId: string;
  daysWritten: number;
  plansSeen: number;
  plansUsed: number;
  menusPruned: number;
  message: string;
  from: string;
  to: string;
};

export function SyncInventoryWeeklyMenuButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function run() {
    if (
      !confirm(
        "Muat Menu Minggu Ini untuk SEMUA kategori dari Rencana Produksi Inventory?\n\nJadwal diganti dari rencana Disetujui/Diproses/Selesai (minggu ini + minggu depan). Favorit lama di luar sync akan disembunyikan."
      )
    ) {
      return;
    }
    setLoading(true);
    setMsg(null);
    setIsError(false);
    try {
      const res = await fetch("/api/weekly-menu/sync-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: "all" }),
      });
      const data = (await res.json()) as {
        error?: string;
        results?: SyncResultRow[];
      };
      if (!res.ok) {
        setIsError(true);
        setMsg(data.error || "Gagal sinkron");
        return;
      }
      const rows = data.results || [];
      const totalDays = rows.reduce((n, r) => n + (r.daysWritten || 0), 0);
      const totalUsed = rows.reduce((n, r) => n + (r.plansUsed || 0), 0);
      const totalSeen = rows[0]?.plansSeen ?? 0;
      const totalPruned = rows.reduce((n, r) => n + (r.menusPruned || 0), 0);
      const range =
        rows[0]?.from && rows[0]?.to ? `${rows[0].from} – ${rows[0].to}` : "";
      const parts = [
        `Sinkron selesai — ${totalDays} hari terjadwal`,
        `${totalUsed} rencana dipakai (${totalSeen} dilihat)`,
        range,
      ];
      if (totalPruned > 0) parts.push(`${totalPruned} favorit lama dinonaktifkan`);
      setMsg(parts.filter(Boolean).join(" · "));
      router.refresh();
    } catch {
      setIsError(true);
      setMsg("Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={loading}
        onClick={() => void run()}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Sync semua dari Inventory
      </Button>
      {msg && (
        <p
          className={`text-xs ${isError ? "text-destructive" : "text-muted-foreground"}`}
          role="status"
        >
          {msg}
        </p>
      )}
    </div>
  );
}
