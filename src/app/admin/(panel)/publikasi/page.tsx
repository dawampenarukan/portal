import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllPublications } from "@/lib/queries";

export const metadata = { title: "Publikasi Fixed" };

export default async function AdminPublikasiPage() {
  const publications = await getAllPublications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Publikasi Fixed</h2>
          <p className="text-muted-foreground">
            Kelola laporan kinerja dan hasil survey yang ditampilkan di beranda.
          </p>
        </div>
        <Link href="/admin/publikasi/new">
          <Button>
            <Plus className="h-4 w-4" />
            Buat Publikasi
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {publications.map((pub) => (
          <Card key={pub.id}>
            <CardHeader>
              <CardTitle className="text-base">{pub.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary">{pub.period}</p>
              <p className="mt-2 text-sm text-muted-foreground">{pub.summary}</p>
              <Link href={`/admin/publikasi/${pub.id}/edit`}>
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
