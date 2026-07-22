import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationNav } from "@/components/admin/pagination-nav";
import { ArticleCoverImage } from "@/components/news/article-cover-image";
import { getAdminEventsList } from "@/lib/queries";
import { totalPages } from "@/lib/pagination";

export async function AdminEventList({ page }: { page: number }) {
  const { items: events, total } = await getAdminEventsList(page);
  const pages = totalPages(total);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada event.{" "}
        <Link href="/admin/event/new" prefetch={false} className="text-primary hover:underline">
          Tambah event pertama
        </Link>
      </p>
    );
  }

  if (events.length === 0 && page > pages) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Halaman {page} tidak tersedia.{" "}
          <Link href="/admin/event" prefetch={false} className="text-primary hover:underline">
            Kembali ke halaman 1
          </Link>
        </p>
        <PaginationNav basePath="/admin/event" page={pages} total={total} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <div className="relative aspect-video">
              <ArticleCoverImage
                src={event.coverImage}
                alt={event.title}
                fill
                fallbackEmoji="🎉"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{event.title}</CardTitle>
                <Badge variant={event.isPublished ? "success" : "secondary"}>
                  {event.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
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
      <PaginationNav basePath="/admin/event" page={page} total={total} />
    </div>
  );
}

export function AdminEventHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold">Kelola Event</h2>
        <p className="text-muted-foreground">Atur jadwal, gambar cover, dan detail kegiatan.</p>
      </div>
      <Link href="/admin/event/new" prefetch={false} className="shrink-0">
        <Button>
          <Plus className="h-4 w-4" />
          Tambah Event
        </Button>
      </Link>
    </div>
  );
}
