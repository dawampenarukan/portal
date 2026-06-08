"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MenuRequestView } from "@/lib/types";

const statusLabel: Record<string, string> = {
  NEW: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  REJECTED: "Ditolak",
};

interface MenuRequestsManagerProps {
  initialRequests: MenuRequestView[];
}

export function MenuRequestsManager({ initialRequests }: MenuRequestsManagerProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setLoading(id);
    const res = await fetch(`/api/menu-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(null);
    if (!res.ok) return;
    const updated = await res.json();
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: updated.status } : r)));
    router.refresh();
  }

  async function deleteRequest(id: string) {
    if (!confirm("Hapus request ini?")) return;
    setLoading(id);
    await fetch(`/api/menu-requests/${id}`, { method: "DELETE" });
    setLoading(null);
    setRequests((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  const newCount = requests.filter((r) => r.status === "NEW").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Request Menu Pengunjung</h3>
        {newCount > 0 && <Badge variant="popular">{newCount} baru</Badge>}
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada request menu.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{req.menuName}</p>
                  <p className="text-sm text-muted-foreground">
                    {req.requesterName} ·{" "}
                    {format(new Date(req.createdAt), "d MMM yyyy", { locale: localeId })}
                  </p>
                  {req.reason && (
                    <p className="mt-2 text-sm text-muted-foreground">{req.reason}</p>
                  )}
                </div>
                <Badge variant={req.status === "NEW" ? "popular" : "secondary"}>
                  {statusLabel[req.status] ?? req.status}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {req.status === "NEW" && (
                  <>
                    <Button
                      size="sm"
                      disabled={loading === req.id}
                      onClick={() => updateStatus(req.id, "IN_PROGRESS")}
                    >
                      Proses
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={loading === req.id}
                      onClick={() => updateStatus(req.id, "RESOLVED")}
                    >
                      Selesai
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === req.id}
                      onClick={() => updateStatus(req.id, "REJECTED")}
                    >
                      Tolak
                    </Button>
                  </>
                )}
                {req.status === "IN_PROGRESS" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={loading === req.id}
                    onClick={() => updateStatus(req.id, "RESOLVED")}
                  >
                    Tandai Selesai
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading === req.id}
                  onClick={() => deleteRequest(req.id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
