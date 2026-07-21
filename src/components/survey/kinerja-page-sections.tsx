import { FillSurveyButton } from "@/components/survey/fill-survey-button";
import { KinerjaSurveyDashboardLoader } from "@/components/survey/kinerja-survey-dashboard-loader";
import { Card, CardContent } from "@/components/ui/card";
import {
  getActiveSurveySummariesCached,
  getPerformancePublicationsCached,
  getSurveyPublicationsCached,
} from "@/lib/cached-queries";
import { safeQuery } from "@/lib/safe-db";

/** Boundary 1 — publikasi survey + chart dashboard. */
export async function KinerjaSurveyResultsSection() {
  const surveyPublications = await safeQuery(
    () => getSurveyPublicationsCached(),
    [],
    "getSurveyPublications"
  );

  const defaultPublicationId =
    surveyPublications.find(
      (p) => p.isPublished && (p.chartData?.respondents ?? 0) > 0
    )?.id ??
    surveyPublications.find((p) => p.isPublished)?.id ??
    surveyPublications[0]?.id ??
    null;

  return (
    <KinerjaSurveyDashboardLoader
      publications={surveyPublications}
      activeSurveys={[]}
      defaultPublicationId={defaultPublicationId}
    />
  );
}

/** Boundary 2 — tombol isi survey aktif (query terpisah). */
export async function KinerjaActiveSurveysSection() {
  const activeSurveys = await safeQuery(
    () => getActiveSurveySummariesCached(),
    [],
    "getActiveSurveySummaries"
  );

  if (activeSurveys.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white/70 px-4 py-3 backdrop-blur-sm">
      <p className="text-sm text-muted-foreground">
        Ada survey aktif — bantu evaluasi layanan SPPG.
      </p>
      <FillSurveyButton surveys={activeSurveys} />
    </div>
  );
}

/** Boundary 3 — laporan kinerja. */
export async function KinerjaPerformanceSection() {
  const performancePublications = await safeQuery(
    () => getPerformancePublicationsCached(),
    [],
    "getPerformancePublications"
  );

  if (performancePublications.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Laporan Kinerja</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {performancePublications.map((pub) => (
          <Card key={pub.id}>
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {pub.period}
              </p>
              <h3 className="mt-2 text-lg font-bold">{pub.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{pub.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
