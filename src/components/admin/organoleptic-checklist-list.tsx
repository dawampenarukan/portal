"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORGANOLEPTIC_PLACE_LABELS,
  ORGANOLEPTIC_TIMING_LABELS,
  averageScores,
  formatInspectionDateInput,
} from "@/lib/organoleptic-meta";
import { formatDate } from "@/lib/utils";
import type { OrganolepticChecklistView } from "@/lib/types";

interface OrganolepticChecklistListProps {
  initialChecklists: OrganolepticChecklistView[];
  initialDate: string;
}

export function OrganolepticChecklistList({
  initialChecklists,
  initialDate,
}: OrganolepticChecklistListProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [checklists, setChecklists] = useState(initialChecklists);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadByDate(nextDate: string) {
    setLoading(true);
    const res = await fetch(`/api/organoleptic?date=${nextDate}`);
    setLoading(false);
    if (!res.ok) return;
    const data = (await res.json()) as OrganolepticChecklistView[];
    setChecklists(data);
    setDate(nextDate);
    router.replace(`/admin/menu/organoleptik?date=${nextDate}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus checklist ini?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/organoleptic/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) return;
    setChecklists((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Filter tanggal</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => loadByDate(e.target.value)}
            disabled={loading}
            className="w-auto"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => loadByDate(formatInspectionDateInput(new Date()))}
          disabled={loading}
        >
          Hari ini
        </Button>
        <p className="text-sm text-muted-foreground">
          {checklists.length} lembar pada {formatDate(date)}
        </p>
      </div>

      {checklists.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada checklist untuk tanggal ini.
        </p>
      ) : (
        <div className="space-y-3">
          {checklists.map((checklist) => {
            const avgs = averageScores(checklist.items);
            const unsafe = checklist.items.filter((i) => i.safety === "TIDAK_AMAN").length;

            return (
              <div
                key={checklist.id}
                className="rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{checklist.placeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {ORGANOLEPTIC_PLACE_LABELS[checklist.placeType as keyof typeof ORGANOLEPTIC_PLACE_LABELS]} ·{" "}
                      {ORGANOLEPTIC_TIMING_LABELS[checklist.timing as keyof typeof ORGANOLEPTIC_TIMING_LABELS]}
                    </p>
                    <p className="mt-1 text-sm">
                      Pemeriksa: <span className="font-medium">{checklist.inspectorName}</span> ·{" "}
                      {checklist.inspectionTime}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {unsafe > 0 ? (
                      <Badge variant="popular">{unsafe} tidak aman</Badge>
                    ) : (
                      <Badge className="bg-primary/90">Semua aman</Badge>
                    )}
                    <Badge variant="secondary">1 paket ({checklist.items.length} item)</Badge>
                    <Badge variant="outline">Rata-rata {avgs.overall.toFixed(1)}</Badge>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/admin/menu/organoleptik/${checklist.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="mr-1 h-4 w-4" />
                      Detail
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(checklist.id)}
                    disabled={deletingId === checklist.id}
                  >
                    <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                    Hapus
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
