"use client";

import { useMemo, useState } from "react";
import { SurveyWidgetLoader } from "@/components/dashboard/survey-widget-loader";
import { AtmPagePanel } from "@/components/layout/atm-page-shell";
import { FillSurveyButton } from "@/components/survey/fill-survey-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PublicationView, SurveyDataView, SurveyPublicationView } from "@/lib/types";

const emptySurvey: SurveyDataView = {
  satisfactionScore: 0,
  npsScore: 0,
  respondents: 0,
  target: 0,
  aspects: [],
  trend: [],
};

interface ActiveSurveyOption {
  id: string;
  title: string;
}

interface KinerjaSurveyDashboardProps {
  publications: SurveyPublicationView[];
  performancePublications: PublicationView[];
  activeSurveys: ActiveSurveyOption[];
  defaultPublicationId: string | null;
}

function resolveDefaultId(
  publications: SurveyPublicationView[],
  defaultPublicationId: string | null
): string | null {
  if (defaultPublicationId && publications.some((p) => p.id === defaultPublicationId)) {
    return defaultPublicationId;
  }
  const publishedWithData = publications.find(
    (p) => p.isPublished && (p.chartData?.respondents ?? 0) > 0
  );
  if (publishedWithData) return publishedWithData.id;
  const anyPublished = publications.find((p) => p.isPublished);
  if (anyPublished) return anyPublished.id;
  return publications[0]?.id ?? null;
}

export function KinerjaSurveyDashboard({
  publications,
  performancePublications,
  activeSurveys,
  defaultPublicationId,
}: KinerjaSurveyDashboardProps) {
  const initialId = useMemo(
    () => resolveDefaultId(publications, defaultPublicationId),
    [publications, defaultPublicationId]
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialId);

  const selected = publications.find((p) => p.id === selectedId) ?? null;
  const surveyData = selected?.chartData ?? emptySurvey;
  const fillHref =
    selected?.surveyId != null
      ? `/survey/${selected.surveyId}`
      : activeSurveys[0]
        ? `/survey/${activeSurveys[0].id}`
        : undefined;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {selected?.title ?? "Ringkasan Kinerja"}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {selected
              ? selected.summary
              : "Publikasi hasil survey kepuasan dan laporan kinerja SPPG Penarukan 2."}
          </p>
          {selected && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={selected.isPublished ? "success" : "secondary"}>
                {selected.isPublished ? "Dipublikasikan" : "Belum dipublikasikan"}
              </Badge>
              <span className="text-xs text-muted-foreground">{selected.period}</span>
            </div>
          )}
        </div>
        <FillSurveyButton surveys={activeSurveys} />
      </div>

      <AtmPagePanel variant="glass">
        <SurveyWidgetLoader data={surveyData} fillSurveyHref={fillHref} />
      </AtmPagePanel>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Publikasi Survey</h2>
            <p className="text-sm text-muted-foreground">
              Klik kartu untuk menampilkan hasil survey di atas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-5 rounded-sm ring-2 ring-primary bg-primary/10" />
              Sedang ditampilkan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-1 rounded-sm bg-emerald-500" />
              Dipublikasikan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-1 rounded-sm bg-gray-300" />
              Belum dipublikasikan
            </span>
          </div>
        </div>

        {publications.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Belum ada publikasi survey. Buat survey di admin lalu publikasikan hasilnya.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {publications.map((pub) => {
              const isSelected = pub.id === selectedId;
              return (
                <button
                  key={pub.id}
                  type="button"
                  onClick={() => setSelectedId(pub.id)}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      "h-full border-l-4 transition-all hover:shadow-md",
                      pub.isPublished ? "border-l-emerald-500" : "border-l-gray-300 bg-muted/20",
                      isSelected && "ring-2 ring-primary ring-offset-2 bg-primary/5 shadow-sm"
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {pub.period}
                        </p>
                        <Badge
                          variant={pub.isPublished ? "success" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {pub.isPublished ? "Dipublikasikan" : "Draft"}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-lg font-bold">{pub.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{pub.summary}</p>
                      {isSelected && (
                        <p className="mt-3 text-xs font-semibold text-primary">
                          ✓ Ditampilkan di dashboard
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {performancePublications.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Laporan Kinerja</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {performancePublications.map((pub) => (
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
      )}
    </div>
  );
}
