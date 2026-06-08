import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockPublications } from "@/lib/mock-data";

export const metadata = { title: "Publikasi Fixed" };

export default function AdminPublikasiPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Publikasi Fixed</h2>
          <p className="text-muted-foreground">
            Kelola laporan kinerja dan hasil survey yang ditampilkan di beranda.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Buat Publikasi
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockPublications.map((pub) => (
          <Card key={pub.id}>
            <CardHeader>
              <CardTitle className="text-base">{pub.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary">{pub.period}</p>
              <p className="mt-2 text-sm text-muted-foreground">{pub.summary}</p>
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
