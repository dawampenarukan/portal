import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { getEventById } from "@/lib/queries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  return { title: event ? `Edit ${event.title}` : "Edit Event" };
}

export default async function AdminEventEditPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/event" prefetch={false} className="text-sm text-primary hover:underline">
          ← Kembali ke Kelola Event
        </Link>
        <h2 className="mt-2 text-2xl font-bold">Edit Event</h2>
        <p className="text-muted-foreground">{event.title}</p>
      </div>
      <EventForm
        initial={{
          id: event.id,
          title: event.title,
          slug: event.slug ?? "",
          description: event.description ?? "",
          location: event.location,
          startAt: event.startAt ?? "",
          endAt: event.endAt ?? "",
          coverImage: event.coverImage ?? null,
          isPublished: event.isPublished ?? false,
        }}
      />
    </div>
  );
}
