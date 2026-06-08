"use client";

import dynamic from "next/dynamic";
import type { SurveyDataView } from "@/lib/types";

const SurveyWidget = dynamic(
  () => import("@/components/dashboard/survey-widget").then((m) => m.SurveyWidget),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-xl bg-muted/60" aria-label="Memuat grafik survey" />
    ),
  }
);

interface SurveyWidgetLoaderProps {
  data: SurveyDataView;
  fillSurveyHref?: string;
}

export function SurveyWidgetLoader({ data, fillSurveyHref }: SurveyWidgetLoaderProps) {
  return <SurveyWidget data={data} fillSurveyHref={fillSurveyHref} />;
}
