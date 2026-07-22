"use client";

import dynamic from "next/dynamic";
import { DeferUntilVisible } from "@/components/ui/defer-until-visible";
import type { SurveyDataView } from "@/lib/types";

const surveyFallback = (
  <div className="h-48 animate-pulse rounded-xl bg-muted/60" aria-label="Memuat grafik survey" />
);

const SurveyWidget = dynamic(
  () => import("@/components/dashboard/survey-widget").then((m) => m.SurveyWidget),
  {
    ssr: false,
    loading: () => surveyFallback,
  }
);

interface SurveyWidgetLoaderProps {
  data: SurveyDataView;
  fillSurveyHref?: string;
  /** Skip IntersectionObserver when parent already deferred (e.g. Kinerja dashboard). */
  eager?: boolean;
}

export function SurveyWidgetLoader({
  data,
  fillSurveyHref,
  eager = false,
}: SurveyWidgetLoaderProps) {
  const widget = <SurveyWidget data={data} fillSurveyHref={fillSurveyHref} />;
  if (eager) return widget;
  return <DeferUntilVisible fallback={surveyFallback}>{widget}</DeferUntilVisible>;
}
