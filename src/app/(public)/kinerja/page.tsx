import Link from "next/link";
import { SurveyWidget } from "@/components/dashboard/survey-widget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getActiveSurvey, getPublishedPublications, getSurveyData } from "@/lib/queries";

export const metadata = {
  title: "Kinerja & Survey",
};

export default async function KinerjaPage() {
  const [surveyData, publications, activeSurvey] = await Promise.all([
    getSurveyData(),
    getPublishedPublications(),
    getActiveSurvey(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kinerja & Hasil Survey</h1>
          <p className="mt-1 text-muted-foreground">
            Publikasi hasil survey kepuasan dan laporan kinerja SPPG Penarukan 2.
          </p>
        </div>
        {activeSurvey && (
          <Link href={`/survey/${activeSurvey.id}`}>
            <Button>Isi Survey Aktif ⭐</Button>
          </Link>
        )}
      </div>

      <SurveyWidget data={surveyData} />

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Publikasi Fixed</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {publications.map((pub) => (
            <Card key={pub.id}>
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {pub.period}
                </p>
                <h3 className="mt-2 text-lg font-bold">{pub.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{pub.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
