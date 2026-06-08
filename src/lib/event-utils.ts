import type { EventView } from "@/lib/types";

/** Event masih upcoming jika waktu selesai (atau mulai) belum lewat. */
export function isUpcomingEvent(
  event: Pick<EventView, "startAt" | "endAt">,
  now = new Date()
): boolean {
  if (!event.startAt) return false;
  const end = event.endAt ? new Date(event.endAt) : new Date(event.startAt);
  return end >= now;
}

export function filterUpcomingEvents(events: EventView[], now = new Date()): EventView[] {
  return events.filter((event) => isUpcomingEvent(event, now));
}

export function splitEventsBySchedule(events: EventView[], now = new Date()) {
  const upcoming = filterUpcomingEvents(events, now);
  return { upcoming, all: events };
}
