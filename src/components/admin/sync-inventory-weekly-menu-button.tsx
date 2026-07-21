"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncInventoryWeeklyMenuButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    if (
      !confirm(
        "Muat Menu Minggu Ini untuk SEMUA kategori dari Rencana Produksi Inventory?\n\nJadwal minggu berjalan akan diganti."
      )
    ) {
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/weekly-menu/sync-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: "all" }),
      });
      const data = (await res.json()) as {
        error?: string;
        results?: Array<{ categoryId: string; daysWritten: number; message: string }>;
      };
      if (!res.ok) {
        setMsg(data.error || "Gagal sinkron");
        return;
      }
      const total = (data.results || []).reduce((n, r) => n + (r.daysWritten || 0), 0);
      setMsg(`Sinkron selesai — ${total} hari terjadwal di semua kategori`);
      router.refresh();
    } catch {
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
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
