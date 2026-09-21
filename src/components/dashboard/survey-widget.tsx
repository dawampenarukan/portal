"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Heart, Star, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveyDataView } from "@/lib/types";

const CHART_GREEN = "#2e9b6a";
const CHART_CORAL = "#ff8a65";

interface SurveyWidgetProps {
  data: SurveyDataView;
  fillSurveyHref?: string;
}

function trendDomain(trend: { score: number }[]): [number, number] {
  if (trend.length === 0) return [0, 5];
  const scores = trend.map((t) => t.score);
  const min = Math.min(...scores, 1);
  const max = Math.max(...scores, 5);
  return [Math.max(0, Math.floor(min) - 0.5), Math.min(5, Math.ceil(max) + 0.5)];
}

export function SurveyWidget({ data, fillSurveyHref }: SurveyWidgetProps) {
  const { satisfactionScore, npsScore, respondents, target, aspects, trend } = data;
  const choiceBreakdown = data.choiceBreakdown ?? [];
  const hasData = respondents > 0;
  const [trendMin, trendMax] = trendDomain(trend);

  if (!hasData) {
    return (
      <Card className="charming-card border-0">
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Data survey belum tersedia.</p>
          {fillSurveyHref && (
            <Link
              href={fillSurveyHref}
              className="mt-3 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Isi survey sekarang
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="charming-card border-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-2xl bg-sunny/40 p-3 text-amber-700">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Kepuasan</p>
              <p className="text-2xl font-extrabold text-primary">{satisfactionScore}/5</p>
            </div>
          </CardContent>
        </Card>
        <Card className="charming-card border-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-2xl bg-accent p-3 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Skor Bahagia</p>
              <p className="text-2xl font-extrabold text-primary">{npsScore}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="charming-card border-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-2xl bg-sky/30 p-3 text-sky-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Yang Menjawab</p>
              <p className="text-2xl font-extrabold text-primary">{respondents}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="charming-card border-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-2xl bg-coral/20 p-3 text-coral">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Target Tercapai</p>
              <p className="text-2xl font-extrabold text-primary">{target}%</p>
              {data.respondentTarget != null && data.respondentTarget > 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  {respondents}/{data.respondentTarget} responden
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {aspects.length > 0 ? (
          <Card className="charming-card border-0">
            <CardHeader>
              <CardTitle className="text-base">Aspek kepuasan (rating)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={aspects}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e4d8" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill={CHART_GREEN} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {trend.length > 0 ? (
          <Card className="charming-card border-0">
            <CardHeader>
              <CardTitle className="text-base">Tren kepuasan bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e4d8" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[trendMin, trendMax]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={CHART_CORAL}
                    strokeWidth={3}
                    dot={{ fill: CHART_CORAL, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {choiceBreakdown.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Hasil pilihan</h3>
          {choiceBreakdown.map((block) => (
            <Card key={block.questionId} className="charming-card border-0">
              <CardHeader>
                <CardTitle className="text-base">{block.question}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {block.type === "checkbox" ? "Multi-pilih" : "Pilihan tunggal"} — persen dari
                  responden yang menjawab pertanyaan ini
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {block.options.map((opt) => (
                  <div key={opt.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span>{opt.label}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {opt.count} ({opt.percent}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, opt.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
