"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResetMenuFavoritesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function run() {
    if (
      !confirm(
        "Hapus SEMUA nama menu favorit dan suara ❤️ di SEMUA kategori?\n\nJadwal Menu Minggu Ini tidak diubah. Daftar favorit bisa diisi ulang lewat Sync Inventory atau dengan menyimpan jadwal mingguan."
      )
    ) {
      return;
    }
    setLoading(true);
    setMsg(null);
    setIsError(false);
    try {
      const res = await fetch("/api/menu-items/reset", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        deletedItems?: number;
        clearedRequests?: number;
      };
      if (!res.ok) {
        setIsError(true);
        setMsg(data.error || "Gagal reset");
        return;
      }
      const deleted = data.deletedItems ?? 0;
      const cleared = data.clearedRequests ?? 0;
      const parts = [`Reset selesai — ${deleted} menu favorit dihapus`];
      if (cleared > 0) parts.push(`${cleared} request dilepas dari menu`);
      setMsg(parts.join(" · "));
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
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => void run()}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Reset favorit semua kategori
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
