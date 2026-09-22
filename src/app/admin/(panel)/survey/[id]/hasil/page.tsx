import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurveyDownloadButton } from "@/components/admin/survey-download-button";
import { SurveyWidgetLoader } from "@/components/dashboard/survey-widget-loader";
import { getSurveyById } from "@/lib/queries";
import { aggregateSurveyResults } from "@/lib/survey-aggregation";

export const metadata = { title: "Hasil Survey" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminSurveyHasilPage({ params }: Props) {
  const { id } = await params;
  const survey = await getSurveyById(id);
  if (!survey) notFound();

  const chartData = await aggregateSurveyResults(id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link
            href="/admin/survey"
            prefetch={false}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Hasil Survey</h2>
          <p className="text-sm text-muted-foreground">{survey.title}</p>
          {survey.description ? (
            <p className="text-sm text-muted-foreground">{survey.description}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {chartData.respondents} responden · target {chartData.respondentTarget ?? survey.respondentTarget} ·
            tampilan ringkas (sama lengkap dengan portal)
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <SurveyDownloadButton
            surveyId={survey.id}
            responseCount={chartData.respondents}
            variant="secondary"
          />
          {survey.isActive ? (
            <Link href={`/survey/${survey.id}`} prefetch={false} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">
                Halaman isi
              </Button>
            </Link>
          ) : null}
          <Link href={`/admin/survey/${survey.id}/edit`} prefetch={false}>
            <Button size="sm" variant="outline">
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <SurveyWidgetLoader data={chartData} eager />
    </div>
  );
}
