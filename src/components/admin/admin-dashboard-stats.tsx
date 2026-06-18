import Link from "next/link";
import {
  ClipboardList,
  Inbox,
  MessageSquare,
  Newspaper,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/queries";
import { EMPTY_DASHBOARD_STATS, safeQuery } from "@/lib/safe-db";

export async function AdminDashboardStats() {
  const stats = await safeQuery(
    () => getDashboardStats(),
    EMPTY_DASHBOARD_STATS,
    "getDashboardStats"
  );

  const statCards = [
    { label: "Total Berita", value: String(stats.articleCount), icon: Newspaper, color: "text-sky-600 bg-sky-100" },
    { label: "Komentar Pending", value: String(stats.pendingComments), icon: MessageSquare, color: "text-amber-600 bg-amber-100" },
    { label: "Masukan Baru", value: String(stats.newFeedbacks), icon: Inbox, color: "text-red-600 bg-red-100" },
    { label: "Responden Survey", value: String(stats.surveyRespondents), icon: Users, color: "text-emerald-600 bg-emerald-100" },
  ];

  return (
    <>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            Aksi Cepat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Link href="/admin/berita/new" prefetch={false} className="block text-primary hover:underline">
            + Tulis berita baru
          </Link>
          <Link href="/admin/event/new" prefetch={false} className="block text-primary hover:underline">
            + Tambah event
          </Link>
          <Link href="/admin/komentar" prefetch={false} className="block text-primary hover:underline">
            Moderasi komentar ({stats.pendingComments} pending)
          </Link>
          <Link href="/admin/masukan" prefetch={false} className="block text-primary hover:underline">
            Inbox masukan ({stats.newFeedbacks} baru)
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
