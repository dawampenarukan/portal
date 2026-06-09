import { Suspense } from 'react';
import { WelcomeBanner } from '@/components/home/welcome-banner';
import {
  HomeEventsSection,
  HomeHeroSection,
  HomeHighlightsSection,
  HomeLatestNewsSection,
  HomeMenuSection,
  HomePublicationsSection,
  HomeSurveySection,
} from '@/components/home/home-sections';
import { AtmPageShell } from '@/components/layout/atm-page-shell';
import {
  CardGridSkeleton,
  ChartSkeleton,
  HeroSkeleton,
  ListSkeleton,
} from '@/components/ui/route-skeletons';

export const revalidate = 60;

export default function HomePage() {
  return (
    <div className='mx-auto max-w-7xl px-4 py-8'>
      <AtmPageShell theme='home' innerClassName='space-y-12'>
        <WelcomeBanner />

        <div className='atm-section-block'>
          <Suspense fallback={<HeroSkeleton />}>
            <HomeHeroSection />
          </Suspense>
        </div>

        <div className='atm-section-block'>
          <Suspense fallback={<CardGridSkeleton count={4} />}>
            <HomeMenuSection />
          </Suspense>
        </div>

        <div className='atm-section-block'>
          <Suspense fallback={<ChartSkeleton />}>
            <HomeSurveySection />
          </Suspense>
        </div>

        <div className='atm-section-block'>
          <Suspense fallback={<CardGridSkeleton count={2} cols='sm:grid-cols-2' />}>
            <HomeHighlightsSection />
          </Suspense>
        </div>

        <div className='atm-section-block'>
          <Suspense fallback={<CardGridSkeleton count={3} cols='md:grid-cols-3' />}>
            <HomeEventsSection />
          </Suspense>
        </div>

        <div className='atm-section-block'>
          <Suspense fallback={<CardGridSkeleton count={2} cols='sm:grid-cols-2' />}>
            <HomePublicationsSection />
          </Suspense>
        </div>

        <div className='atm-section-block'>
          <Suspense fallback={<ListSkeleton rows={5} />}>
            <HomeLatestNewsSection />
          </Suspense>
        </div>
      </AtmPageShell>
    </div>
  );
}
