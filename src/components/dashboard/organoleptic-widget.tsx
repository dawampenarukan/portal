"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight, ClipboardCheck, Package, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ORGANOLEPTIC_PLACE_LABELS } from "@/lib/organoleptic-meta";
import { formatDate } from "@/lib/utils";
import type { OrganolepticPlaceSummary, OrganolepticPublicView } from "@/lib/types";

const CHART_GREEN = "#2e9b6a";
const CHART_CORAL = "#ff8a65";
const CHART_SKY = "#89cff0";
const CHART_SUNNY = "#ffe08a";
const LOCATION_PREVIEW_COUNT = 3;

interface OrganolepticWidgetProps {
  data: OrganolepticPublicView;
}

export function OrganolepticWidget({ data }: OrganolepticWidgetProps) {
  const { summary, recentPlaces } = data;
  const [showAllLocations, setShowAllLocations] = useState(false);
  const hasData = summary.checklistCount > 0;

  if (!hasData) {
    return (
      <Card className="charming-card border-0">
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Hasil uji organoleptik belum tersedia.</p>
          <p className="mt-1 text-sm">Data akan tampil setelah checklist harian diinput.</p>
        </CardContent>
      </Card>
    );
  }

  const aspectData = [
    { name: "Rasa", score: Number(summary.avgTaste.toFixed(1)) },
    { name: "Warna", score: Number(summary.avgColor.toFixed(1)) },
    { name: "Aroma", score: Number(summary.avgAroma.toFixed(1)) },
    { name: "Tekstur", score: Number(summary.avgTexture.toFixed(1)) },
  ];

  const safetyData = [
    { name: "Aman", value: summary.safeCount, color: CHART_GREEN },
    { name: "Tidak aman", value: summary.unsafeCount, color: CHART_CORAL },
  ].filter((d) => d.value > 0);

  const safetyTotal = summary.safeCount + summary.unsafeCount;
  const safePercent = safetyTotal > 0 ? Math.round((summary.safeCount / safetyTotal) * 100) : 0;
  const visiblePlaces = showAllLocations
    ? recentPlaces
    : recentPlaces.slice(0, LOCATION_PREVIEW_COUNT);
  const hasMoreLocations = recentPlaces.length > LOCATION_PREVIEW_COUNT;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Data uji terbaru — {formatDate(summary.date)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          icon={<ClipboardCheck className="h-5 w-5" />}
          label="Sekolah / Posyandu"
          value={String(summary.checklistCount)}
          tone="sky"
        />
        <ScoreCard
          icon={<Package className="h-5 w-5" />}
          label="Paket Diuji"
          value={String(summary.checklistCount)}
          sub={`${summary.itemCount} item menu`}
          tone="sunny"
        />
        <ScoreCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Menu Aman"
          value={String(summary.safeCount)}
          sub={`${safePercent}%`}
          tone="green"
        />
        <ScoreCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Perlu Perhatian"
          value={String(summary.unsafeCount)}
          tone="coral"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="charming-card border-0 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">📊 Skor Organoleptik Rata-rata</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={aspectData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e4d8" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} / 5`, "Skor"]}
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                />
                <Bar dataKey="score" radius={[10, 10, 0, 0]}>
                  {aspectData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={[CHART_GREEN, CHART_SKY, CHART_SUNNY, CHART_CORAL][i % 4]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/5">
                Keseluruhan {summary.avgOverall.toFixed(1)} / 5
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="charming-card border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">✅ Status Keamanan Menu</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {safetyData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={safetyData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {safetyData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm">
                  {safetyData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1.5 font-semibold">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.name}: {d.value}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-12 text-sm text-muted-foreground">Belum ada data keamanan.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {recentPlaces.length > 0 && (
        <Card className="charming-card border-0">
          <CardHeader>
            <CardTitle className="text-base">🏫 Lokasi yang Sudah Diuji</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {visiblePlaces.map((place, index) => (
                <PlaceCard key={`${place.placeName}-${index}`} place={place} />
              ))}
            </div>
            {hasMoreLocations && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllLocations((v) => !v)}
                >
                  {showAllLocations ? "Tampilkan lebih sedikit" : "Lihat semuanya"}
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${showAllLocations ? "rotate-90" : ""}`}
                  />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PlaceCard({ place }: { place: OrganolepticPlaceSummary }) {
  const allSafe = place.unsafeCount === 0;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        allSafe ? "border-primary/20 bg-primary/5" : "border-coral/30 bg-coral/5"
      }`}
    >
      <div className="min-w-0 pr-2">
        <p className="truncate font-semibold">{place.placeName}</p>
        <p className="text-xs text-muted-foreground">
          {ORGANOLEPTIC_PLACE_LABELS[
            place.placeType as keyof typeof ORGANOLEPTIC_PLACE_LABELS
          ] ?? place.placeType}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <Badge variant={allSafe ? "success" : "popular"} className="text-[10px]">
          {allSafe ? "Aman" : `${place.unsafeCount} perlu cek`}
        </Badge>
        <p className="mt-1 text-xs font-bold text-primary">{place.avgOverall.toFixed(1)}/5</p>
      </div>
    </div>
  );
}

function ScoreCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "green" | "coral" | "sky" | "sunny";
}) {
  const tones = {
    green: "bg-primary/10 text-primary",
    coral: "bg-coral/15 text-coral",
    sky: "bg-sky/25 text-sky-800",
    sunny: "bg-sunny/35 text-amber-800",
  };

  return (
    <Card className="charming-card border-0">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-2xl p-3 ${tones[tone]}`}>{icon}</div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="text-2xl font-extrabold text-primary">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
