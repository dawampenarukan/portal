import { Suspense } from "react";
import { WelcomeBanner } from "@/components/home/welcome-banner";
import {
  HomeEventsSection,
  HomeHeroSection,
  HomeHighlightsSection,
  HomeLatestNewsSection,
  HomeMenuSection,
  HomePublicationsSection,
  HomeSurveySection,
} from "@/components/home/home-sections";
import {
  CardGridSkeleton,
  ChartSkeleton,
  HeroSkeleton,
  ListSkeleton,
} from "@/components/ui/route-skeletons";

export const revalidate = 60;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
      <WelcomeBanner />

      <Suspense fallback={<HeroSkeleton />}>
        <HomeHeroSection />
      </Suspense>

      <Suspense fallback={<CardGridSkeleton count={4} />}>
        <HomeMenuSection />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <HomeSurveySection />
      </Suspense>

      <Suspense fallback={<CardGridSkeleton count={2} cols="sm:grid-cols-2" />}>
        <HomeHighlightsSection />
      </Suspense>

      <Suspense fallback={<CardGridSkeleton count={3} cols="md:grid-cols-3" />}>
        <HomeEventsSection />
      </Suspense>

      <Suspense fallback={<CardGridSkeleton count={2} cols="sm:grid-cols-2" />}>
        <HomePublicationsSection />
      </Suspense>

      <Suspense fallback={<ListSkeleton rows={5} />}>
        <HomeLatestNewsSection />
      </Suspense>
    </div>
  );
}
