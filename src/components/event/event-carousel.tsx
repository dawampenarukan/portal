import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
}

interface EventCarouselProps {
  events: Event[];
}

const eventEmojis = ["🥗", "👩‍🍳", "🎊"];

export function EventCarousel({ events }: EventCarouselProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {events.map((event, i) => (
        <Card key={event.id} className="charming-card min-w-[280px] shrink-0 border-0">
          <CardContent className="p-5">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl">
              {eventEmojis[i % eventEmojis.length]}
            </div>
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
