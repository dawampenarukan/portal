import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SurveyWidgetLoader } from "@/components/dashboard/survey-widget-loader";
import { getActiveSurveySummariesCached, getSurveyDataCached } from "@/lib/cached-queries";
import { getDashboardStats } from "@/lib/queries";
import { safeQuery } from "@/lib/safe-db";

export async function AdminDashboardSurveySection() {
  const emptySurvey = {
    satisfactionScore: 0,
    npsScore: 0,
    respondents: 0,
    target: 0,
    aspects: [],
    trend: [],
  };

  const [surveyData, activeSurveys, stats] = await Promise.all([
    safeQuery(() => getSurveyDataCached(), emptySurvey, "getSurveyData"),
    safeQuery(() => getActiveSurveySummariesCached(), [], "getActiveSurveySummaries"),
    getDashboardStats(),
  ]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-amber-500" />
            Survey Terkini
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {surveyData.respondents > 0 ? (
            <>
              <p>
                Skor kepuasan:{" "}
                <strong className="text-foreground">{surveyData.satisfactionScore}/5</strong>
              </p>
              <p className="mt-1">
                Responden: <strong className="text-foreground">{surveyData.respondents}</strong>{" "}
                (total DB: {stats.surveyRespondents})
              </p>
              <p className="mt-1">
                NPS: <strong className="text-foreground">{surveyData.npsScore}</strong>
              </p>
              <Link href="/admin/survey" prefetch={false} className="mt-3 inline-block text-primary hover:underline">
                Kelola survey →
              </Link>
            </>
          ) : (
            <p>
              Belum ada data survey.{" "}
              <Link href="/admin/survey/new" prefetch={false} className="text-primary hover:underline">
                Buat survey
              </Link>
              {activeSurveys[0] && (
                <>
                  {" "}
                  atau{" "}
                  <Link href={`/survey/${activeSurveys[0].id}`} prefetch={false} className="text-primary hover:underline">
                    isi survey aktif
                  </Link>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {surveyData.respondents > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-semibold">Visualisasi Survey Live</h3>
          <SurveyWidgetLoader
            data={surveyData}
            fillSurveyHref={activeSurveys[0] ? `/survey/${activeSurveys[0].id}` : undefined}
          />
        </section>
      )}
    </>
  );
}
