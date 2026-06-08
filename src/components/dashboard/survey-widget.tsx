"use client";

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
import { mockSurveyData } from "@/lib/mock-data";

const CHART_GREEN = "#2e9b6a";
const CHART_CORAL = "#ff8a65";

export function SurveyWidget() {
  const { satisfactionScore, npsScore, respondents, target, aspects, trend } =
    mockSurveyData;

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
              <p className="text-2xl font-extrabold text-primary">{target} ✓</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="charming-card border-0">
          <CardHeader>
            <CardTitle className="text-base">🍽️ Apa yang Paling Disukai?</CardTitle>
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

        <Card className="charming-card border-0">
          <CardHeader>
            <CardTitle className="text-base">📈 Makin Senang Tiap Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e4d8" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[3, 5]} tick={{ fontSize: 11 }} />
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
      </div>
    </div>
  );
}
