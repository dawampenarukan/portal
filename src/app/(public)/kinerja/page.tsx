import { Suspense } from "react";
import {
  AtmPageHeader,
  AtmPageShell,
} from "@/components/layout/atm-page-shell";
import {
  KinerjaActiveSurveysSection,
  KinerjaPerformanceSection,
  KinerjaSurveyResultsSection,
} from "@/components/survey/kinerja-page-sections";
import {
  CardGridSkeleton,
  ChartSkeleton,
} from "@/components/ui/route-skeletons";

export const metadata = {
  title: "Kinerja & Survey",
};

export const revalidate = 60;

export default function KinerjaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <AtmPageHeader
        theme="kinerja"
        emoji="📊"
        title="Kinerja & Hasil Survey"
        description="Publikasi hasil survey kepuasan dan laporan kinerja SPPG Penarukan 2."
      />

      <AtmPageShell theme="kinerja" innerClassName="space-y-10">
        <Suspense
          fallback={
            <div className="h-14 animate-pulse rounded-2xl bg-muted/60" />
          }
        >
          <KinerjaActiveSurveysSection />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <KinerjaSurveyResultsSection />
        </Suspense>

        <Suspense
          fallback={
            <CardGridSkeleton count={2} cols="md:grid-cols-2" />
          }
        >
          <KinerjaPerformanceSection />
        </Suspense>
      </AtmPageShell>
    </div>
  );
}
