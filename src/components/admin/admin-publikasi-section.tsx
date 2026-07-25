import Link from "next/link";
import { Plus } from "lucide-react";
import { PublicationActions } from "@/components/admin/publication-actions";
import { PublicationForm } from "@/components/admin/publication-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationNav } from "@/components/admin/pagination-nav";
import { getAdminPublicationsList, getPublicationById } from "@/lib/queries";
import { totalPages } from "@/lib/pagination";

export async function AdminPublikasiEditor({
  mode,
  editId,
}: {
  mode: "buat" | "edit";
  editId?: string;
}) {
  if (mode === "edit") {
    if (!editId) {
      return (
        <p className="text-sm text-destructive">
          ID publikasi tidak valid.{" "}
          <Link href="/admin/publikasi" className="text-primary hover:underline">
            Kembali
          </Link>
        </p>
      );
    }
    const publication = await getPublicationById(editId);
    if (!publication) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            Publikasi tidak ditemukan (id: {editId}).
          </p>
          <Link href="/admin/publikasi" className="text-sm text-primary hover:underline">
            ← Kembali ke daftar
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div>
          <Link href="/admin/publikasi" prefetch={false} className="text-sm text-primary hover:underline">
            ← Kembali ke daftar
          </Link>
          <h2 className="mt-2 text-2xl font-bold">Edit Publikasi</h2>
          <p className="text-muted-foreground">{publication.title}</p>
        </div>
        <PublicationForm publication={publication} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/publikasi" prefetch={false} className="text-sm text-primary hover:underline">
          ← Kembali ke daftar
        </Link>
        <h2 className="mt-2 text-2xl font-bold">Buat Publikasi</h2>
        <p className="text-muted-foreground">Tambah laporan kinerja atau publikasi hasil.</p>
      </div>
      <PublicationForm />
    </div>
  );
}

export async function AdminPublikasiList({ page }: { page: number }) {
  const { items: publications, total } = await getAdminPublicationsList(page);
  const pages = totalPages(total);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada publikasi.{" "}
        <Link
          href="/admin/publikasi?buat=1"
          prefetch={false}
          className="text-primary hover:underline"
        >
          Buat publikasi pertama
        </Link>
      </p>
    );
  }

  if (publications.length === 0 && page > pages) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Halaman {page} tidak tersedia.{" "}
          <Link href="/admin/publikasi" prefetch={false} className="text-primary hover:underline">
            Kembali ke halaman 1
          </Link>
        </p>
        <PaginationNav basePath="/admin/publikasi" page={pages} total={total} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {publications.map((pub) => (
          <Card key={pub.id}>
            <CardHeader>
              <CardTitle className="text-base">{pub.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary">{pub.period}</p>
              <p className="mt-2 text-sm text-muted-foreground">{pub.summary}</p>
              <PublicationActions publicationId={pub.id} title={pub.title} />
            </CardContent>
          </Card>
        ))}
      </div>
      <PaginationNav basePath="/admin/publikasi" page={page} total={total} />
    </div>
  );
}

export function AdminPublikasiHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold">Publikasi Hasil</h2>
        <p className="text-muted-foreground">
          Kelola laporan kinerja dan hasil survey yang ditampilkan di beranda.
        </p>
      </div>
      <Link href="/admin/publikasi?buat=1" prefetch={false} className="shrink-0">
        <Button>
          <Plus className="h-4 w-4" />
          Buat Publikasi
        </Button>
      </Link>
    </div>
  );
}
