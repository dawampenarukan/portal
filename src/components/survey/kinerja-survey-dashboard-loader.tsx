"use client";

import dynamic from "next/dynamic";
import { DeferUntilVisible } from "@/components/ui/defer-until-visible";
import type { SurveyPublicationView } from "@/lib/types";

const dashboardFallback = (
  <div className="space-y-6 animate-pulse" aria-label="Memuat dashboard survey">
    <div className="h-10 w-64 max-w-full rounded-lg bg-muted" />
    <div className="h-48 rounded-xl bg-muted/60" />
    <div className="h-64 rounded-xl bg-muted/60" />
  </div>
);

const KinerjaSurveyDashboard = dynamic(
  () =>
    import("@/components/survey/kinerja-survey-dashboard").then(
      (m) => m.KinerjaSurveyDashboard
    ),
  {
    ssr: false,
    loading: () => dashboardFallback,
  }
);

interface ActiveSurveyOption {
  id: string;
  title: string;
}

interface KinerjaSurveyDashboardLoaderProps {
  publications: SurveyPublicationView[];
  activeSurveys?: ActiveSurveyOption[];
  defaultPublicationId: string | null;
}

export function KinerjaSurveyDashboardLoader(
  props: KinerjaSurveyDashboardLoaderProps
) {
  return (
    <DeferUntilVisible fallback={dashboardFallback}>
      <KinerjaSurveyDashboard {...props} />
    </DeferUntilVisible>
  );
}
