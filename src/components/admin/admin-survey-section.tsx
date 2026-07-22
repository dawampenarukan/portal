import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaginationNav } from "@/components/admin/pagination-nav";
import { SurveyActions } from "@/components/admin/survey-actions";
import { getAdminSurveysList } from "@/lib/queries";
import { totalPages } from "@/lib/pagination";

export async function AdminSurveyList({ page }: { page: number }) {
  const { items: surveys, total } = await getAdminSurveysList(page);
  const pages = totalPages(total);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daftar Survey</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 && (
          <p className="text-sm text-muted-foreground">
            Belum ada survey.{" "}
            <Link href="/admin/survey/new" prefetch={false} className="text-primary hover:underline">
              Buat survey pertama
            </Link>
          </p>
        )}
        {total > 0 && surveys.length === 0 && page > pages && (
          <p className="text-sm text-muted-foreground">
            Halaman {page} tidak tersedia.{" "}
            <Link href="/admin/survey" prefetch={false} className="text-primary hover:underline">
              Kembali ke halaman 1
            </Link>
          </p>
        )}
        {surveys.map((survey) => (
          <div key={survey.id} className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold">{survey.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {survey._count.questions} pertanyaan · {survey._count.responses} responden ·
                  target {survey.respondentTarget}
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
              <Badge variant={survey.isActive ? "success" : "secondary"} className="w-fit shrink-0">
                {survey.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <div className="mt-4">
              <SurveyActions surveyId={survey.id} />
            </div>
          </div>
        ))}
        {total > 0 && (
          <PaginationNav
            basePath="/admin/survey"
            page={Math.min(page, pages)}
            total={total}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function AdminSurveyHeader() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold">Kelola Survey</h2>
        <p className="text-muted-foreground">
          Buat kuesioner kepuasan. Skor kepuasan dan skor bahagia diperbarui otomatis dari jawaban
          responden.
        </p>
      </div>
      <Link href="/admin/survey/new" prefetch={false} className="shrink-0">
        <Button>
          <Plus className="h-4 w-4" />
          Buat Survey
        </Button>
      </Link>
    </div>
  );
}
