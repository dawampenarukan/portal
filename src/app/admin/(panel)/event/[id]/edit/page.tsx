import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { getEventById } from "@/lib/queries";

export const metadata = { title: "Edit Event" };

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Edit Event</h2>
        <p className="text-muted-foreground">{event.title}</p>
      </div>
      <EventForm event={event} />
    </div>
  );
}
