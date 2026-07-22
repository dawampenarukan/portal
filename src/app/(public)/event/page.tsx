import { Calendar } from 'lucide-react';
import { EventCarousel } from '@/components/event/event-carousel';
import {
  AtmPageHeader,
  AtmPagePanel,
  AtmPageShell,
} from '@/components/layout/atm-page-shell';
import { ArticleCoverImage } from '@/components/news/article-cover-image';
import { Card, CardContent } from '@/components/ui/card';
import { getPublishedEventsCached } from '@/lib/cached-queries';
import { filterUpcomingEvents, splitEventsBySchedule } from '@/lib/event-utils';
import { safeQuery } from '@/lib/safe-db';

export const metadata = {
  title: 'Event',
};

export const revalidate = 60;

export default async function EventPage() {
  const events = await safeQuery(
    () => getPublishedEventsCached(),
    [],
    'getPublishedEvents'
  );
  const { upcoming, all } = splitEventsBySchedule(events);

  return (
    <div className='mx-auto max-w-7xl px-4 py-8'>
      <AtmPageHeader
        theme='event'
        emoji='🎉'
        title='Event & Kegiatan'
        description='Jadwal kegiatan, edukasi, dan acara SPPG Penarukan 2.'
      />

      <AtmPageShell theme='event' innerClassName='space-y-10'>
        <AtmPagePanel variant='glass'>
          <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
            <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sunny/45 to-coral/35 text-lg'>
              📅
            </span>
            Event Mendatang
          </h2>
          {upcoming.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              Belum ada jadwal event mendatang. Lihat arsip di bawah.
            </p>
          ) : (
            <EventCarousel events={upcoming} />
          )}
        </AtmPagePanel>

        <AtmPagePanel variant='glass'>
          <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
            <Calendar className='h-5 w-5 text-primary' />
            Semua Event
          </h2>
          {all.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Belum ada event.</p>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {all.map((event) => (
                <Card key={event.id} className='overflow-hidden border-0 bg-white/80'>
                  <div className='relative aspect-video'>
                    <ArticleCoverImage
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      fallbackEmoji='🎉'
                      sizes='(max-width: 768px) 100vw, 33vw'
                    />
                  </div>
                  <CardContent className='p-5'>
                    <h3 className='font-semibold'>{event.title}</h3>
                    <p className='mt-2 text-sm text-muted-foreground'>
                      {event.location}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {event.date} · {event.time}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </AtmPagePanel>
      </AtmPageShell>
    </div>
  );
}
