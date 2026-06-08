import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockEvents } from "@/lib/mock-data";

export const metadata = { title: "Kelola Event" };

export default function AdminEventPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kelola Event</h2>
          <p className="text-muted-foreground">Atur jadwal dan detail kegiatan.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Tambah Event
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockEvents.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="text-base">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{event.location}</p>
              <p>{event.date} · {event.time}</p>
              <Button variant="outline" size="sm" className="mt-4">
                Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
