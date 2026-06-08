import { KinerjaSurveyDashboard } from "@/components/survey/kinerja-survey-dashboard";
import {
  getActiveSurveys,
  getPerformancePublications,
  getSurveyPublications,
} from "@/lib/queries";
import { safeQuery } from "@/lib/safe-db";

export const metadata = {
  title: "Kinerja & Survey",
};

export const revalidate = 60;

export default async function KinerjaPage() {
  const [surveyPublications, performancePublications, activeSurveys] = await Promise.all([
    safeQuery(() => getSurveyPublications(), [], "getSurveyPublications"),
    safeQuery(() => getPerformancePublications(), [], "getPerformancePublications"),
    safeQuery(() => getActiveSurveys(), [], "getActiveSurveys"),
  ]);

  const defaultPublicationId =
    surveyPublications.find((p) => p.isPublished && (p.chartData?.respondents ?? 0) > 0)?.id ??
    surveyPublications.find((p) => p.isPublished)?.id ??
    surveyPublications[0]?.id ??
    null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <KinerjaSurveyDashboard
        publications={surveyPublications}
        performancePublications={performancePublications}
        activeSurveys={activeSurveys.map((s) => ({ id: s.id, title: s.title }))}
        defaultPublicationId={defaultPublicationId}
      />
    </div>
  );
}
