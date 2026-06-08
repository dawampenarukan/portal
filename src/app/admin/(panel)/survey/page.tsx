import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Kelola Survey" };

export default function AdminSurveyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kelola Survey</h2>
          <p className="text-muted-foreground">
            Buat kuesioner kepuasan dan publikasikan hasilnya ke beranda.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Buat Survey
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Survey Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Survey Kepuasan Pelanggan Juni 2026</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  5 pertanyaan · 347 responden · Periode Juni 2026
                </p>
              </div>
              <Badge variant="success">Aktif</Badge>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline">
                Edit Pertanyaan
              </Button>
              <Button size="sm" variant="outline">
                Lihat Hasil
              </Button>
              <Button size="sm">Publikasikan ke Beranda</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
