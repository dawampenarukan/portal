import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllEvents } from "@/lib/queries";

export async function AdminEventList() {
  const events = await getAllEvents();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <CardTitle className="text-base">{event.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{event.location}</p>
            <p>
              {event.date} · {event.time}
            </p>
            <Link href={`/admin/event/${event.id}/edit`} prefetch={false}>
              <Button variant="outline" size="sm" className="mt-4">
                Edit
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminEventHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Kelola Event</h2>
        <p className="text-muted-foreground">Atur jadwal dan detail kegiatan.</p>
      </div>
      <Link href="/admin/event/new" prefetch={false}>
        <Button>
          <Plus className="h-4 w-4" />
          Tambah Event
        </Button>
      </Link>
    </div>
  );
}
