import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllEvents } from "@/lib/queries";

export const metadata = { title: "Kelola Event" };

export default async function AdminEventPage() {
  const events = await getAllEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kelola Event</h2>
          <p className="text-muted-foreground">Atur jadwal dan detail kegiatan.</p>
        </div>
        <Link href="/admin/event/new">
          <Button>
            <Plus className="h-4 w-4" />
            Tambah Event
          </Button>
        </Link>
      </div>

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
              <Link href={`/admin/event/${event.id}/edit`}>
                <Button variant="outline" size="sm" className="mt-4">
                  Edit
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
