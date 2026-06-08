import { SurveyWidget } from "@/components/dashboard/survey-widget";
import { Card, CardContent } from "@/components/ui/card";
import { mockPublications } from "@/lib/mock-data";

export const metadata = {
  title: "Kinerja & Survey",
};

export default function KinerjaPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Kinerja & Hasil Survey</h1>
        <p className="mt-1 text-muted-foreground">
          Publikasi hasil survey kepuasan dan laporan kinerja SPPG Penarukan 2.
        </p>
      </div>

      <SurveyWidget />

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Publikasi Fixed</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {mockPublications.map((pub) => (
            <Card key={pub.id}>
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {pub.period}
                </p>
                <h3 className="mt-2 text-lg font-bold">{pub.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{pub.summary}</p>
                <p className="mt-4 text-sm font-medium text-primary">
                  Laporan lengkap akan tersedia untuk diunduh setelah modul publikasi aktif.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
