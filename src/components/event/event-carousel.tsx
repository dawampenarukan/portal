import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleCoverImage } from "@/components/news/article-cover-image";

interface EventItem {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  coverImage?: string | null;
}

interface EventCarouselProps {
  events: EventItem[];
}

export function EventCarousel({ events }: EventCarouselProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {events.map((event) => (
        <Card key={event.id} className="charming-card min-w-[280px] shrink-0 overflow-hidden border-0">
          <div className="relative aspect-[16/10]">
            <ArticleCoverImage
              src={event.coverImage}
              alt={event.title}
              fill
              fallbackEmoji="🎉"
            />
          </div>
          <CardContent className="p-5">
            <h3 className="font-extrabold leading-snug">{event.title}</h3>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                {event.date}
              </p>
              <p className="flex items-center gap-2 font-medium">
                <Clock className="h-4 w-4 text-coral" />
                {event.time}
              </p>
              <p className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-sky" />
                {event.location}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
