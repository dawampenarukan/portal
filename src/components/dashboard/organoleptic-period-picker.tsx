"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatOrganolepticPeriodLabel } from "@/lib/organoleptic-meta";
import type { OrganolepticUnsafeTrendPoint } from "@/lib/types";

export type PeriodPickMode = "day" | "range";

export type OrganolepticStatItem = {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "green" | "coral" | "sky" | "sunny";
};

const WEEKDAYS = ["Mi", "Sn", "Sl", "Ra", "Ka", "Ju", "Sa"];

const STAT_TONES = {
  green: "bg-primary/10 text-primary",
  coral: "bg-coral/15 text-coral",
  sky: "bg-sky/25 text-sky-800",
  sunny: "bg-sunny/35 text-amber-800",
};

const TREND_CORAL = "#ff8a65";

function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function parseDateKey(key: string): Date {
  return parseISO(key);
}

export interface OrganolepticPeriodPickerProps {
  mode: PeriodPickMode;
  onModeChange: (mode: PeriodPickMode) => void;
  selectedDay: string;
  rangeFrom: string | null;
  rangeTo: string | null;
  rangeAnchor: string | null;
  onDayPick: (dateKey: string) => void;
  onRangePick: (from: string, to: string) => void;
  onRangeAnchor: (dateKey: string | null) => void;
  onToday: () => void;
  loading?: boolean;
  periodLabel: string;
  stats: OrganolepticStatItem[];
  unsafeTrend?: OrganolepticUnsafeTrendPoint[];
}

function UnsafeTrendChart({ data }: { data?: OrganolepticUnsafeTrendPoint[] }) {
  const points = data ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-coral/20 bg-gradient-to-b from-coral/[0.07] to-white px-2 py-1.5">
      <p className="text-[10px] font-bold text-coral">Trend Perlu Perhatian</p>
      {points.length === 0 ? (
        <p className="flex h-20 flex-1 items-center justify-center text-[10px] text-muted-foreground">
          Belum ada data
        </p>
      ) : (
        <div className="mt-1 min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e4d8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip
                formatter={(value: number) => [`${value} menu`, "Perlu perhatian"]}
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as OrganolepticUnsafeTrendPoint | undefined;
                  return point?.date ?? "";
                }}
                contentStyle={{
                  borderRadius: 10,
                  border: "none",
                  fontSize: 11,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={TREND_CORAL}
                strokeWidth={2.5}
                dot={{ r: 3, fill: TREND_CORAL, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: TREND_CORAL }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value, sub, tone }: OrganolepticStatItem) {
  return (
    <div className="flex h-full min-h-[4.5rem] items-center gap-2 rounded-lg border border-primary/8 bg-muted/25 px-2.5 py-2.5">
      <div className={cn("shrink-0 rounded-md p-1.5", STAT_TONES[tone])}>
        <span className="flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold leading-snug text-muted-foreground">{label}</p>
        <p className="mt-1 text-base font-extrabold leading-none text-primary">{value}</p>
        {sub && <p className="mt-0.5 text-[9px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function OrganolepticPeriodPicker({
  mode,
  onModeChange,
  selectedDay,
  rangeFrom,
  rangeTo,
  rangeAnchor,
  onDayPick,
  onRangePick,
  onRangeAnchor,
  onToday,
  loading = false,
  periodLabel,
  stats,
  unsafeTrend,
}: OrganolepticPeriodPickerProps) {
  const initialMonth = selectedDay ? parseDateKey(selectedDay) : new Date();
  const [viewMonth, setViewMonth] = useState(startOfMonth(initialMonth));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewMonth]);

  const statusHint =
    mode === "range" && rangeAnchor
      ? `Pilih tanggal akhir (awal: ${formatOrganolepticPeriodLabel(rangeAnchor)})`
      : mode === "range"
        ? "Ketuk tanggal awal lalu akhir"
        : null;

  function handleDayClick(date: Date) {
    if (loading) return;
    const key = toDateKey(date);

    if (mode === "day") {
      onDayPick(key);
      return;
    }

    if (!rangeAnchor) {
      onRangeAnchor(key);
      return;
    }

    const from = rangeAnchor <= key ? rangeAnchor : key;
    const to = rangeAnchor <= key ? key : rangeAnchor;
    onRangeAnchor(null);
    onRangePick(from, to);
  }

  function getDayState(dateKey: string) {
    const inCurrentMonth = isSameMonth(parseDateKey(dateKey), viewMonth);

    if (mode === "day") {
      return {
        inCurrentMonth,
        isSelected: dateKey === selectedDay,
        inRange: false,
        isRangeStart: false,
        isRangeEnd: false,
      };
    }

    const endKey = rangeTo ?? rangeAnchor;
    const startKey = rangeFrom ?? rangeAnchor;
    let inRange = false;
    let isRangeStart = false;
    let isRangeEnd = false;

    if (startKey && endKey) {
      const from = startKey <= endKey ? startKey : endKey;
      const to = startKey <= endKey ? endKey : startKey;
      inRange = dateKey >= from && dateKey <= to;
      isRangeStart = dateKey === from;
      isRangeEnd = dateKey === to;
    } else if (rangeAnchor) {
      isRangeStart = dateKey === rangeAnchor;
    }

    return { inCurrentMonth, isSelected: false, inRange, isRangeStart, isRangeEnd };
  }

  const calendar = (
    <div className={cn("w-full", loading && "pointer-events-none opacity-60")}>
      <div className="mb-1 flex items-center justify-between px-0.5">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-primary hover:bg-accent"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-xs font-bold capitalize text-foreground">
          {format(viewMonth, "MMM yyyy", { locale: localeId })}
        </p>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-primary hover:bg-accent"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {WEEKDAYS.map((day, i) => (
          <div
            key={`${day}-${i}`}
            className="py-0.5 text-center text-[9px] font-bold text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {calendarDays.map((date) => {
          const dateKey = toDateKey(date);
          const state = getDayState(dateKey);
          const today = isToday(date);
          const isEndpoint = state.isSelected || state.isRangeStart || state.isRangeEnd;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => handleDayClick(date)}
              className={cn(
                "flex h-7 items-center justify-center rounded-md text-[11px] font-semibold transition-colors",
                !state.inCurrentMonth && "text-muted-foreground/30",
                state.inCurrentMonth &&
                  !state.inRange &&
                  !isEndpoint &&
                  "hover:bg-primary/10 hover:text-primary",
                state.inRange && !isEndpoint && "bg-primary/10 text-primary",
                isEndpoint && "bg-primary text-primary-foreground",
                today &&
                  !isEndpoint &&
                  "font-bold text-primary underline decoration-primary/40 underline-offset-2"
              )}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-primary/10 bg-card px-3 py-2.5 shadow-sm sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: "day" as const, label: "Hari" },
              { id: "range" as const, label: "Rentang" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={loading}
              onClick={() => onModeChange(item.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
                mode === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
          <button
            type="button"
            disabled={loading}
            onClick={onToday}
            className="rounded-full px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-accent"
          >
            Hari ini
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          {loading && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
          <span className="max-w-[11rem] truncate sm:max-w-none">{periodLabel}</span>
        </div>
      </div>

      {statusHint && <p className="mt-1 text-[10px] text-muted-foreground">{statusHint}</p>}

      <div className="mt-2 grid min-h-[11.5rem] grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:gap-5">
        <div className="flex justify-center md:block">{calendar}</div>
        <div className="grid grid-cols-2 grid-rows-2 gap-2.5">
          {stats.map((stat, i) => (
            <MiniStat key={i} {...stat} />
          ))}
        </div>
        <div className="flex min-h-[11.5rem] min-w-0">
          <UnsafeTrendChart data={unsafeTrend} />
        </div>
      </div>
    </div>
  );
}
