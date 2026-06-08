"use client";

import dynamic from "next/dynamic";
import type { PublicationView, SurveyPublicationView } from "@/lib/types";

const KinerjaSurveyDashboard = dynamic(
  () =>
    import("@/components/survey/kinerja-survey-dashboard").then((m) => m.KinerjaSurveyDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-muted" />
        <div className="h-48 rounded-xl bg-muted/60" />
        <div className="h-64 rounded-xl bg-muted/60" />
      </div>
    ),
  }
);

interface ActiveSurveyOption {
  id: string;
  title: string;
}

interface KinerjaSurveyDashboardLoaderProps {
  publications: SurveyPublicationView[];
  performancePublications: PublicationView[];
  activeSurveys: ActiveSurveyOption[];
  defaultPublicationId: string | null;
}

export function KinerjaSurveyDashboardLoader(props: KinerjaSurveyDashboardLoaderProps) {
  return <KinerjaSurveyDashboard {...props} />;
}
