import { EventForm } from "@/components/admin/event-form";

export const metadata = { title: "Tambah Event" };

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tambah Event</h2>
        <p className="text-muted-foreground">Buat kegiatan baru untuk portal.</p>
      </div>
      <EventForm />
    </div>
  );
}
