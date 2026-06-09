import { KinerjaSurveyDashboardLoader } from '@/components/survey/kinerja-survey-dashboard-loader';
import {
  AtmPageHeader,
  AtmPageShell,
} from '@/components/layout/atm-page-shell';
import {
  getActiveSurveySummariesCached,
  getPerformancePublicationsCached,
  getSurveyPublicationsCached,
} from '@/lib/cached-queries';
import { safeQuery } from '@/lib/safe-db';

export const metadata = {
  title: 'Kinerja & Survey',
};

export const revalidate = 60;

export default async function KinerjaPage() {
  const [surveyPublications, performancePublications, activeSurveys] =
    await Promise.all([
      safeQuery(
        () => getSurveyPublicationsCached(),
        [],
        'getSurveyPublications'
      ),
      safeQuery(
        () => getPerformancePublicationsCached(),
        [],
        'getPerformancePublications'
      ),
      safeQuery(
        () => getActiveSurveySummariesCached(),
        [],
        'getActiveSurveySummaries'
      ),
    ]);

  const defaultPublicationId =
    surveyPublications.find(
      (p) => p.isPublished && (p.chartData?.respondents ?? 0) > 0
    )?.id ??
    surveyPublications.find((p) => p.isPublished)?.id ??
    surveyPublications[0]?.id ??
    null;

  return (
    <div className='mx-auto max-w-7xl px-4 py-8'>
      <AtmPageHeader
        theme='kinerja'
        emoji='📊'
        title='Kinerja & Hasil Survey'
        description='Publikasi hasil survey kepuasan dan laporan kinerja SPPG Penarukan 2.'
      />

      <AtmPageShell theme='kinerja'>
        <KinerjaSurveyDashboardLoader
          publications={surveyPublications}
          performancePublications={performancePublications}
          activeSurveys={activeSurveys}
          defaultPublicationId={defaultPublicationId}
        />
      </AtmPageShell>
    </div>
  );
}
