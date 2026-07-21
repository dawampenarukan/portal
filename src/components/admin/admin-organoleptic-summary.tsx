import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getOrganolepticChecklists,
  getOrganolepticDailySummary,
} from "@/lib/organoleptic-queries";
import {
  ORGANOLEPTIC_PLACE_LABELS,
  ORGANOLEPTIC_TIMING_LABELS,
} from "@/lib/organoleptic-meta";
import { formatDate } from "@/lib/utils";

export async function AdminOrganolepticSummary() {
  const [summary, recentResult] = await Promise.all([
    getOrganolepticDailySummary(),
    getOrganolepticChecklists({ limit: 5 }),
  ]);
  const recent = recentResult.checklists;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">📋</span>
            Uji Organoleptik Harian
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Checklist BGN — {formatDate(summary.date)}
          </p>
        </div>
        <Link href="/admin/menu/organoleptik/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Input Baru
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox label="Lembar hari ini" value={String(summary.checklistCount)} />
          <StatBox label="Paket diuji" value={String(summary.itemCount)} />
          <StatBox label="Aman" value={String(summary.safeCount)} tone="safe" />
          <StatBox label="Tidak aman" value={String(summary.unsafeCount)} tone="unsafe" />
        </div>

        {summary.itemCount > 0 && (
          <div className="rounded-xl bg-muted/40 p-3 text-sm">
            <p className="font-medium">Rata-rata skor hari ini</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">Rasa {summary.avgTaste.toFixed(1)}</Badge>
              <Badge variant="secondary">Warna {summary.avgColor.toFixed(1)}</Badge>
              <Badge variant="secondary">Aroma {summary.avgAroma.toFixed(1)}</Badge>
              <Badge variant="secondary">Tekstur {summary.avgTexture.toFixed(1)}</Badge>
              <Badge variant="outline">Keseluruhan {summary.avgOverall.toFixed(1)}</Badge>
            </div>
          </div>
        )}

        {recent.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Terbaru</p>
            {recent.map((item) => (
              <Link
                key={item.id}
                href={`/admin/menu/organoleptik/${item.id}`}
                className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition hover:border-primary/30 hover:bg-muted/30"
              >
                <span>
                  <span className="font-medium">{item.placeName}</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatDate(item.inspectionDate)}
                  </span>
                </span>
                <Badge variant={item.items.some((i) => i.safety === "TIDAK_AMAN") ? "popular" : "secondary"}>
                  1 paket
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada data. Mulai input checklist harian dari tombol di atas.
          </p>
        )}

        <Link
          href="/admin/menu/organoleptik"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Lihat semua checklist →
        </Link>
      </CardContent>
    </Card>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "safe" | "unsafe";
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === "safe"
          ? "border-primary/20 bg-primary/5"
          : tone === "unsafe"
            ? "border-destructive/20 bg-destructive/5"
            : "bg-muted/20"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export function OrganolepticDetailMeta({
  placeType,
  timing,
}: {
  placeType: string;
  timing: string;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      {ORGANOLEPTIC_PLACE_LABELS[placeType as keyof typeof ORGANOLEPTIC_PLACE_LABELS]} ·{" "}
      {ORGANOLEPTIC_TIMING_LABELS[timing as keyof typeof ORGANOLEPTIC_TIMING_LABELS]}
    </p>
  );
}
