"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Eye, Printer, Trash2 } from "lucide-react";
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
type SafetyFilter = "aman" | "tidak-aman" | null;

interface OrganolepticChecklistListProps {
  initialChecklists: OrganolepticChecklistView[];
  initialDate: string;
  initialDateEnd?: string;
  initialFocus?: FocusFilter;
  initialSafety?: SafetyFilter;
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

function applySafetyFilter(
  rows: OrganolepticChecklistView[],
  safety: SafetyFilter
): OrganolepticChecklistView[] {
  if (safety === "tidak-aman") {
    return rows.filter((c) => c.items.some((i) => i.safety === "TIDAK_AMAN"));
  }
  if (safety === "aman") {
    return rows.filter((c) => !c.items.some((i) => i.safety === "TIDAK_AMAN"));
  }
  return rows;
}

function applyListFilters(
  rows: OrganolepticChecklistView[],
  focus: FocusFilter,
  safety: SafetyFilter
) {
  return applySafetyFilter(applyFocusFilter(rows, focus), safety);
}

function safetyFilterLabel(safety: SafetyFilter, focus: FocusFilter) {
  if (focus === "unsafe") return "Belum dievaluasi";
  if (focus === "returned") return "Paket dikembalikan";
  if (safety === "aman") return "Aman";
  if (safety === "tidak-aman") return "Tidak aman";
  return "Semua";
}

type ChecklistUiFilter = "all" | "aman" | "tidak-aman" | "belum-evaluasi";

function resolveChecklistUiFilter(
  safety: SafetyFilter,
  focus: FocusFilter
): ChecklistUiFilter {
  if (focus === "unsafe") return "belum-evaluasi";
  if (safety === "aman") return "aman";
  if (safety === "tidak-aman") return "tidak-aman";
  return "all";
}

export function OrganolepticChecklistList({
  initialChecklists,
  initialDate,
  initialDateEnd,
  initialFocus = null,
  initialSafety = null,
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
  const [safety, setSafety] = useState<SafetyFilter>(initialSafety);
  const [checklists, setChecklists] = useState(() =>
    applyListFilters(initialChecklists, initialFocus, initialSafety)
  );
  const [truncated, setTruncated] = useState(initialTruncated);
  const [activeLimit, setActiveLimit] = useState(listLimit);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const canEvaluate = isFullAdminRole(userRole);

  async function loadRange(
    from: string,
    to: string,
    nextFocus: FocusFilter = focus,
    nextSafety: SafetyFilter = safety
  ) {
    const range = normalizeInspectionDateRange(from, to);
    if (!range) return;

    setLoading(true);
    const params = new URLSearchParams({ date: range.from });
    if (range.to !== range.from) params.set("dateEnd", range.to);
    if (nextFocus) params.set("focus", nextFocus);
    if (nextSafety) params.set("safety", nextSafety);
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

    setChecklists(applyListFilters(result.checklists, nextFocus, nextSafety));
    setTruncated(result.truncated);
    setActiveLimit(result.limit);
    setDateFrom(range.from);
    setDateTo(range.to);
    setFocus(nextFocus);
    setSafety(nextSafety);

    const urlParams = new URLSearchParams({ date: range.from });
    if (range.to !== range.from) urlParams.set("dateEnd", range.to);
    if (nextFocus) urlParams.set("focus", nextFocus);
    if (nextSafety) urlParams.set("safety", nextSafety);
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
      return applyListFilters(next, focus, safety);
    });
    router.refresh();
  }

  const today = formatInspectionDateInput(new Date());
  const periodLabel = formatOrganolepticPeriodLabel(dateFrom, dateTo);
  const activeChecklistFilter = resolveChecklistUiFilter(safety, focus);
  const checklistFilterOptions: {
    value: ChecklistUiFilter;
    label: string;
  }[] = [
    { value: "all", label: "All" },
    { value: "aman", label: "Aman" },
    { value: "tidak-aman", label: "Tidak aman" },
    { value: "belum-evaluasi", label: "Belum dievaluasi" },
  ];

  function applyChecklistUiFilter(next: ChecklistUiFilter) {
    if (next === "all") {
      void loadRange(dateFrom, dateTo, null, null);
      return;
    }
    if (next === "aman") {
      void loadRange(dateFrom, dateTo, null, "aman");
      return;
    }
    if (next === "tidak-aman") {
      void loadRange(dateFrom, dateTo, null, "tidak-aman");
      return;
    }
    // Temuan tidak aman yang belum dievaluasi
    void loadRange(dateFrom, dateTo, "unsafe", null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 print:hidden">
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
          onClick={() => loadRange(today, today, null, null)}
          disabled={loading}
        >
          Hari ini
        </Button>
        {focus === "returned" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => loadRange(dateFrom, dateTo, null, safety)}
            disabled={loading}
          >
            Hapus filter dikembalikan
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => window.print()}
          disabled={loading || checklists.length === 0}
        >
          <Printer className="mr-1 h-4 w-4" />
          Cetak
        </Button>
        <p className="text-sm text-muted-foreground">
          {checklists.length} lembar · {periodLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <span className="text-sm font-medium text-muted-foreground">
          Filter checklist:
        </span>
        {checklistFilterOptions.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={activeChecklistFilter === opt.value ? "default" : "outline"}
            disabled={loading}
            onClick={() => applyChecklistUiFilter(opt.value)}
            title={
              opt.value === "belum-evaluasi"
                ? "Temuan tidak aman yang belum dievaluasi"
                : undefined
            }
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="hidden print:mb-2 print:block">
        <h1 className="text-sm font-bold leading-tight">
          Checklist Uji Organoleptik — {periodLabel} ·{" "}
          {safetyFilterLabel(safety, focus)} · {checklists.length} lembar
        </h1>
      </div>

      {focus === "unsafe" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 print:hidden">
          Menampilkan checklist dengan{" "}
          <span className="font-semibold">
            temuan tidak aman yang belum dievaluasi
          </span>{" "}
          pada rentang tanggal di atas.
        </p>
      )}
      {focus === "returned" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 print:hidden">
          Menampilkan checklist dengan{" "}
          <span className="font-semibold">paket dikembalikan</span> pada rentang
          tanggal di atas.
        </p>
      )}

      {truncated && (
        <p className="rounded-xl border border-sky/40 bg-sky/10 px-3 py-2 text-sm text-foreground print:hidden">
          Menampilkan {activeLimit} lembar terbaru per halaman (maks. {ORGANOLEPTIC_LIST_HARD_CAP}).
          Persempit rentang tanggal untuk melihat data lainnya. Ringkasan di atas
          tetap menghitung seluruh periode.
        </p>
      )}

      {checklists.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada checklist untuk filter / rentang tanggal ini.
        </p>
      ) : (
        <>
          {/* UI layar: kartu seperti sebelumnya */}
          <div className="space-y-3 print:hidden">
            {checklists.map((checklist) => {
              const avgs = averageScores(checklist.items);
              const unsafe = checklist.items.filter(
                (i) => i.safety === "TIDAK_AMAN"
              ).length;
              const returned = checklist.packagesReturned ?? 0;
              const evaluated = !!checklist.evaluatedAt;
              const openFindings = checklistHasOpenFindings(checklist);
              const canDelete =
                !!currentUserId &&
                canModifyOrganolepticChecklist(
                  userRole,
                  checklist,
                  currentUserId
                );

              return (
                <div
                  key={checklist.id}
                  className="rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{checklist.placeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {
                          ORGANOLEPTIC_PLACE_LABELS[
                            checklist.placeType as keyof typeof ORGANOLEPTIC_PLACE_LABELS
                          ]
                        }{" "}
                        ·{" "}
                        {
                          ORGANOLEPTIC_TIMING_LABELS[
                            checklist.timing as keyof typeof ORGANOLEPTIC_TIMING_LABELS
                          ]
                        }{" "}
                        · {formatOrganolepticPeriodLabel(checklist.inspectionDate)}
                      </p>
                      <p className="mt-1 text-sm">
                        Pemeriksa:{" "}
                        <span className="font-medium">{checklist.inspectorName}</span> ·{" "}
                        {checklist.inspectionTime}
                        {showAllEntries && checklist.createdByName && (
                          <>
                            {" "}
                            · Entri:{" "}
                            <span className="font-medium">
                              {checklist.createdByName}
                            </span>
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
                        <Badge variant="secondary">
                          {returned} dikembalikan (dievaluasi)
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        1 paket ({checklist.items.length} item)
                      </Badge>
                      <Badge variant="outline">
                        Rata-rata {avgs.overall.toFixed(1)}
                      </Badge>
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

          {/* Cetak saja: tabel padat ala Excel */}
          <div className="hidden print:block" id="organoleptic-print-list">
            <table className="w-full border-collapse text-left text-[9px] leading-tight">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">No</th>
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">Tanggal</th>
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">Jam</th>
                  <th className="px-1 py-0.5 font-semibold">Tempat</th>
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">Jenis</th>
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">Uji</th>
                  <th className="px-1 py-0.5 font-semibold">Pemeriksa</th>
                  <th className="whitespace-nowrap px-1 py-0.5 text-center font-semibold">
                    Item
                  </th>
                  <th className="whitespace-nowrap px-1 py-0.5 text-center font-semibold">
                    Tdk aman
                  </th>
                  <th className="px-1 py-0.5 font-semibold">Ket temuan</th>
                  <th className="whitespace-nowrap px-1 py-0.5 text-center font-semibold">
                    Avg
                  </th>
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {checklists.map((checklist, index) => {
                  const avgs = averageScores(checklist.items);
                  const unsafeItems = checklist.items.filter(
                    (i) => i.safety === "TIDAK_AMAN"
                  );
                  const unsafe = unsafeItems.length;
                  const returned = checklist.packagesReturned ?? 0;
                  const evaluated = !!checklist.evaluatedAt;
                  const placeTypeLabel =
                    ORGANOLEPTIC_PLACE_LABELS[
                      checklist.placeType as keyof typeof ORGANOLEPTIC_PLACE_LABELS
                    ] ?? checklist.placeType;
                  const timingLabel =
                    ORGANOLEPTIC_TIMING_LABELS[
                      checklist.timing as keyof typeof ORGANOLEPTIC_TIMING_LABELS
                    ] ?? checklist.timing;
                  const ketTemuan = unsafeItems
                    .map((i) =>
                      i.notes?.trim()
                        ? `${i.foodName}: ${i.notes.trim()}`
                        : i.foodName
                    )
                    .join("; ");

                  return (
                    <tr key={checklist.id} className="border-b border-border/80">
                      <td className="whitespace-nowrap px-1 py-0.5">{index + 1}</td>
                      <td className="whitespace-nowrap px-1 py-0.5">
                        {formatOrganolepticPeriodLabel(checklist.inspectionDate)}
                      </td>
                      <td className="whitespace-nowrap px-1 py-0.5">
                        {checklist.inspectionTime}
                      </td>
                      <td className="px-1 py-0.5 font-medium">
                        {checklist.placeName}
                      </td>
                      <td className="whitespace-nowrap px-1 py-0.5">
                        {placeTypeLabel}
                      </td>
                      <td className="whitespace-nowrap px-1 py-0.5">
                        {timingLabel}
                      </td>
                      <td className="px-1 py-0.5">{checklist.inspectorName}</td>
                      <td className="px-1 py-0.5 text-center tabular-nums">
                        {checklist.items.length}
                      </td>
                      <td className="px-1 py-0.5 text-center tabular-nums">
                        {unsafe}
                      </td>
                      <td className="whitespace-normal break-words px-1 py-0.5">
                        {ketTemuan || "—"}
                      </td>
                      <td className="px-1 py-0.5 text-center tabular-nums">
                        {avgs.overall.toFixed(1)}
                      </td>
                      <td className="whitespace-nowrap px-1 py-0.5">
                        {evaluated
                          ? "Dievaluasi"
                          : unsafe > 0
                            ? "Tidak aman"
                            : "Aman"}
                        {returned > 0 ? ` · ret ${returned}` : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
