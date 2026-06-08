import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";

export const metadata = { title: "Tambah Event" };

export default function AdminEventNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/event" prefetch={false} className="text-sm text-primary hover:underline">
          ← Kembali ke Kelola Event
        </Link>
        <h2 className="mt-2 text-2xl font-bold">Tambah Event</h2>
        <p className="text-muted-foreground">Buat kegiatan baru dengan gambar cover untuk portal.</p>
      </div>
      <EventForm />
    </div>
  );
}
