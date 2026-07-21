"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ORGANOLEPTIC_LIST_DEFAULT_LIMIT,
  ORGANOLEPTIC_LIST_HARD_CAP,
  ORGANOLEPTIC_PLACE_LABELS,
  ORGANOLEPTIC_TIMING_LABELS,
  averageScores,
  checklistHasOpenFindings,
  formatInspectionDateInput,
  formatOrganolepticPeriodLabel,
  normalizeInspectionDateRange,
} from "@/lib/organoleptic-meta";
import { canModifyOrganolepticChecklist, isFullAdminRole } from "@/lib/roles";
import type { OrganolepticChecklistView } from "@/lib/types";

type OrganolepticChecklistListResult = {
  checklists: OrganolepticChecklistView[];
  truncated: boolean;
  limit: number;
};

type FocusFilter = "unsafe" | "returned" | null;

interface OrganolepticChecklistListProps {
  initialChecklists: OrganolepticChecklistView[];
  initialDate: string;
  initialDateEnd?: string;
  initialFocus?: FocusFilter;
  initialTruncated?: boolean;
  listLimit?: number;
  currentUserId?: string;
  userRole?: string | null;
  showAllEntries?: boolean;
}

function applyFocusFilter(
  rows: OrganolepticChecklistView[],
  focus: FocusFilter
): OrganolepticChecklistView[] {
  if (focus === "unsafe") {
    return rows.filter(
      (c) => !c.evaluatedAt && c.items.some((i) => i.safety === "TIDAK_AMAN")
    );
  }
  if (focus === "returned") {
    return rows.filter((c) => !c.evaluatedAt && (c.packagesReturned ?? 0) > 0);
  }
  return rows;
}

export function OrganolepticChecklistList({
  initialChecklists,
  initialDate,
  initialDateEnd,
  initialFocus = null,
  initialTruncated = false,
  listLimit = ORGANOLEPTIC_LIST_DEFAULT_LIMIT,
  currentUserId,
  userRole,
  showAllEntries = false,
}: OrganolepticChecklistListProps) {
  const router = useRouter();
  const initialRange = normalizeInspectionDateRange(
    initialDate,
    initialDateEnd ?? initialDate
  ) ?? { from: initialDate, to: initialDateEnd ?? initialDate };

  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [focus, setFocus] = useState<FocusFilter>(initialFocus);
  const [checklists, setChecklists] = useState(() =>
    applyFocusFilter(initialChecklists, initialFocus)
  );
  const [truncated, setTruncated] = useState(initialTruncated);
  const [activeLimit, setActiveLimit] = useState(listLimit);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const canEvaluate = isFullAdminRole(userRole);

  async function loadRange(from: string, to: string, nextFocus: FocusFilter = focus) {
    const range = normalizeInspectionDateRange(from, to);
    if (!range) return;

    setLoading(true);
    const params = new URLSearchParams({ date: range.from });
    if (range.to !== range.from) params.set("dateEnd", range.to);
    if (nextFocus) params.set("focus", nextFocus);
    params.set("limit", String(ORGANOLEPTIC_LIST_DEFAULT_LIMIT));
    const res = await fetch(`/api/organoleptic?${params.toString()}`);
    setLoading(false);
    if (!res.ok) return;

    const data = (await res.json()) as
      | OrganolepticChecklistListResult
      | OrganolepticChecklistView[];

    const result: OrganolepticChecklistListResult = Array.isArray(data)
      ? {
          checklists: data,
          truncated: data.length >= ORGANOLEPTIC_LIST_DEFAULT_LIMIT,
          limit: ORGANOLEPTIC_LIST_DEFAULT_LIMIT,
        }
      : data;

    // Server sudah filter focus; apply lokal tetap untuk konsistensi setelah evaluate
    setChecklists(applyFocusFilter(result.checklists, nextFocus));
    setTruncated(result.truncated);
    setActiveLimit(result.limit);
    setDateFrom(range.from);
    setDateTo(range.to);
    setFocus(nextFocus);

    const urlParams = new URLSearchParams({ date: range.from });
    if (range.to !== range.from) urlParams.set("dateEnd", range.to);
    if (nextFocus) urlParams.set("focus", nextFocus);
    router.replace(`/admin/menu/organoleptik?${urlParams.toString()}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus checklist ini?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/organoleptic/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Gagal menghapus checklist");
      return;
    }
    setChecklists((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  }

  async function handleEvaluate(id: string) {
    if (!confirm("Tandai temuan checklist ini sudah dievaluasi? Notice navigasi akan dihapus.")) {
      return;
    }
    setEvaluatingId(id);
    const res = await fetch(`/api/organoleptic/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "evaluate" }),
    });
    setEvaluatingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Gagal mengevaluasi checklist");
      return;
    }
    const updated = (await res.json()) as OrganolepticChecklistView;
    setChecklists((prev) => {
      const next = prev.map((c) => (c.id === id ? updated : c));
      return applyFocusFilter(next, focus);
    });
    router.refresh();
  }

  const today = formatInspectionDateInput(new Date());
  const periodLabel = formatOrganolepticPeriodLabel(dateFrom, dateTo);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Dari tanggal</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => loadRange(e.target.value, dateTo)}
            disabled={loading}
            className="w-auto"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Sampai tanggal</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => loadRange(dateFrom, e.target.value)}
            disabled={loading}
            className="w-auto"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => loadRange(today, today, null)}
          disabled={loading}
        >
          Hari ini
        </Button>
        {focus && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => loadRange(dateFrom, dateTo, null)}
            disabled={loading}
          >
            Hapus filter{" "}
            {focus === "unsafe" ? "tidak aman" : "dikembalikan"}
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          {checklists.length} lembar · {periodLabel}
        </p>
      </div>

      {focus && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Menampilkan checklist dengan{" "}
          <span className="font-semibold">
            {focus === "unsafe" ? "temuan tidak aman" : "paket dikembalikan"}
          </span>{" "}
          pada rentang tanggal di atas.
        </p>
      )}

      {truncated && (
        <p className="rounded-xl border border-sky/40 bg-sky/10 px-3 py-2 text-sm text-foreground">
          Menampilkan {activeLimit} lembar terbaru per halaman (maks. {ORGANOLEPTIC_LIST_HARD_CAP}).
          Persempit rentang tanggal untuk melihat data lainnya. Ringkasan di atas
          tetap menghitung seluruh periode.
        </p>
      )}

      {checklists.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada checklist untuk rentang tanggal ini.
        </p>
      ) : (
        <div className="space-y-3">
          {checklists.map((checklist) => {
            const avgs = averageScores(checklist.items);
            const unsafe = checklist.items.filter((i) => i.safety === "TIDAK_AMAN").length;
            const returned = checklist.packagesReturned ?? 0;
            const evaluated = !!checklist.evaluatedAt;
            const openFindings = checklistHasOpenFindings(checklist);
            const canDelete =
              !!currentUserId &&
              canModifyOrganolepticChecklist(userRole, checklist, currentUserId);

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
                      {" · "}
                      {formatOrganolepticPeriodLabel(checklist.inspectionDate)}
                    </p>
                    <p className="mt-1 text-sm">
                      Pemeriksa: <span className="font-medium">{checklist.inspectorName}</span> ·{" "}
                      {checklist.inspectionTime}
                      {showAllEntries && checklist.createdByName && (
                        <>
                          {" "}
                          · Entri: <span className="font-medium">{checklist.createdByName}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {evaluated ? (
                      <Badge className="bg-primary/90">Telah dievaluasi</Badge>
                    ) : unsafe > 0 ? (
                      <Badge variant="popular">{unsafe} tidak aman</Badge>
                    ) : (
                      <Badge className="bg-primary/90">Semua aman</Badge>
                    )}
                    {!evaluated && returned > 0 && (
                      <Badge className="border-0 bg-sunny text-amber-950 hover:bg-sunny">
                        {returned} paket dikembalikan
                      </Badge>
                    )}
                    {evaluated && returned > 0 && (
                      <Badge variant="secondary">{returned} dikembalikan (dievaluasi)</Badge>
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
                  {canEvaluate && openFindings && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEvaluate(checklist.id)}
                      disabled={evaluatingId === checklist.id}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4 text-primary" />
                      Telah di Evaluasi
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(checklist.id)}
                      disabled={deletingId === checklist.id}
                    >
                      <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
