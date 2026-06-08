import { Calendar } from "lucide-react";
import { EventCarousel } from "@/components/event/event-carousel";
import { ArticleCoverImage } from "@/components/news/article-cover-image";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedEventsCached } from "@/lib/cached-queries";
import { filterUpcomingEvents, splitEventsBySchedule } from "@/lib/event-utils";
import { safeQuery } from "@/lib/safe-db";

export const metadata = {
  title: "Event",
};

export const revalidate = 60;

export default async function EventPage() {
  const events = await safeQuery(() => getPublishedEventsCached(), [], "getPublishedEvents");
  const { upcoming, all } = splitEventsBySchedule(events);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Calendar className="h-6 w-6 text-primary" />
          Event & Kegiatan
        </h1>
        <p className="mt-1 text-muted-foreground">
          Jadwal kegiatan, edukasi, dan acara SPPG Penarukan 2.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Event Mendatang</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada jadwal event mendatang. Lihat arsip di bawah.
          </p>
        ) : (
          <EventCarousel events={upcoming} />
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Semua Event</h2>
        {all.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada event.</p>
        ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {all.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <div className="relative aspect-video">
                <ArticleCoverImage
                  src={event.coverImage}
                  alt={event.title}
                  fill
                  fallbackEmoji="🎉"
                />
              </div>
              <CardContent className="p-5">
                <h3 className="font-semibold">{event.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{event.location}</p>
                <p className="text-sm text-muted-foreground">
                  {event.date} · {event.time}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </section>
    </div>
  );
}
