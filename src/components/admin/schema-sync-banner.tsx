"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SchemaStatus } from "@/lib/types";

interface SchemaSyncBannerProps {
  initialStatus: SchemaStatus;
}

export function SchemaSyncBanner({ initialStatus }: SchemaSyncBannerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (status.ready) return null;

  async function handleSync() {
    setSyncing(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/admin/schema-sync", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSyncing(false);

    if (!res.ok) {
      setError(data.error ?? "Gagal memperbarui schema database");
      return;
    }

    setStatus(data.schema as SchemaStatus);
    setMessage(data.message ?? "Schema berhasil diperbarui");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="space-y-2">
          <p className="font-semibold text-amber-900">Database production perlu diperbarui</p>
          <p className="text-sm text-amber-800">
            Role <code className="rounded bg-amber-100 px-1">ORGANOLEPTIC_ENTRY</code> belum ada di
            database. Klik tombol di bawah untuk memperbarui schema secara otomatis.
          </p>
          <ul className="text-xs text-amber-800/90 space-y-1">
            <li>Role entri: {status.organolepticEntryRole ? "✓" : "✗ belum ada"}</li>
            <li>Tabel organoleptik: {status.organolepticChecklistTable ? "✓" : "✗ belum ada"}</li>
            <li>Kolom pemilik entri: {status.createdByIdColumn ? "✓" : "✗ belum ada"}</li>
          </ul>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-primary">{message}</p>}
      <Button type="button" size="sm" onClick={handleSync} disabled={syncing}>
        {syncing ? "Memperbarui..." : "Perbarui Schema Database"}
      </Button>
    </div>
  );
}
