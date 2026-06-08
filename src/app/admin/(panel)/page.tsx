import Link from "next/link";
import {
  ClipboardList,
  Inbox,
  MessageSquare,
  Newspaper,
  Star,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SurveyWidget } from "@/components/dashboard/survey-widget";
import { getActiveSurvey, getDashboardStats, getSurveyData } from "@/lib/queries";

export const metadata = {
  title: "Dashboard Admin",
};

export default async function AdminDashboardPage() {
  const [stats, surveyData, activeSurvey] = await Promise.all([
    getDashboardStats(),
    getSurveyData(),
    getActiveSurvey(),
  ]);

  const statCards = [
    { label: "Total Berita", value: String(stats.articleCount), icon: Newspaper, color: "text-sky-600 bg-sky-100" },
    { label: "Komentar Pending", value: String(stats.pendingComments), icon: MessageSquare, color: "text-amber-600 bg-amber-100" },
    { label: "Masukan Baru", value: String(stats.newFeedbacks), icon: Inbox, color: "text-red-600 bg-red-100" },
    { label: "Responden Survey", value: String(stats.surveyRespondents), icon: Users, color: "text-emerald-600 bg-emerald-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Ringkasan aktivitas portal SPPG Penarukan 2.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
                <p>Skor kepuasan: <strong className="text-foreground">{surveyData.satisfactionScore}/5</strong></p>
                <p className="mt-1">Responden: <strong className="text-foreground">{surveyData.respondents}</strong> (total DB: {stats.surveyRespondents})</p>
                <p className="mt-1">NPS: <strong className="text-foreground">{surveyData.npsScore}</strong></p>
                <Link href="/admin/survey" className="mt-3 inline-block text-primary hover:underline">
                  Kelola survey →
                </Link>
              </>
            ) : (
              <p>
                Belum ada data survey.{" "}
                <Link href="/admin/survey/new" className="text-primary hover:underline">
                  Buat survey
                </Link>
                {activeSurvey && (
                  <>
                    {" "}
                    atau{" "}
                    <Link href={`/survey/${activeSurvey.id}`} className="text-primary hover:underline">
                      isi survey aktif
                    </Link>
                  </>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link href="/admin/berita/new" className="block text-primary hover:underline">+ Tulis berita baru</Link>
            <Link href="/admin/event/new" className="block text-primary hover:underline">+ Tambah event</Link>
            <Link href="/admin/komentar" className="block text-primary hover:underline">Moderasi komentar ({stats.pendingComments} pending)</Link>
            <Link href="/admin/masukan" className="block text-primary hover:underline">Inbox masukan ({stats.newFeedbacks} baru)</Link>
          </CardContent>
        </Card>
      </div>

      {surveyData.respondents > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-semibold">Visualisasi Survey Live</h3>
          <SurveyWidget
            data={surveyData}
            fillSurveyHref={activeSurvey ? `/survey/${activeSurvey.id}` : undefined}
          />
        </section>
      )}
    </div>
  );
}
