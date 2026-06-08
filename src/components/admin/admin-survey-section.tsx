import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SurveyActions } from "@/components/admin/survey-actions";
import { getAdminSurveysList } from "@/lib/queries";

export async function AdminSurveyList() {
  const surveys = await getAdminSurveysList();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daftar Survey</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {surveys.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada survey.{" "}
            <Link href="/admin/survey/new" prefetch={false} className="text-primary hover:underline">
              Buat survey pertama
            </Link>
          </p>
        )}
        {surveys.map((survey) => (
          <div key={survey.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{survey.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {survey._count.questions} pertanyaan · {survey._count.responses} responden · target{" "}
                  {survey.respondentTarget}
                </p>
                {survey.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{survey.description}</p>
                )}
                {survey.isActive && (
                  <Link
                    href={`/survey/${survey.id}`}
                    prefetch={false}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    Lihat halaman publik →
                  </Link>
                )}
              </div>
              <Badge variant={survey.isActive ? "success" : "secondary"}>
                {survey.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <div className="mt-4">
              <SurveyActions surveyId={survey.id} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AdminSurveyHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">Kelola Survey</h2>
        <p className="text-muted-foreground">
          Buat kuesioner kepuasan. Skor kepuasan dan skor bahagia diperbarui otomatis dari jawaban
          responden.
        </p>
      </div>
      <Link href="/admin/survey/new" prefetch={false}>
        <Button>
          <Plus className="h-4 w-4" />
          Buat Survey
        </Button>
      </Link>
    </div>
  );
}
