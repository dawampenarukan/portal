import {
  ClipboardList,
  Inbox,
  MessageSquare,
  Newspaper,
  Star,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Total Berita", value: "24", icon: Newspaper, color: "text-sky-600 bg-sky-100" },
  { label: "Komentar Pending", value: "7", icon: MessageSquare, color: "text-amber-600 bg-amber-100" },
  { label: "Masukan Baru", value: "12", icon: Inbox, color: "text-red-600 bg-red-100" },
  { label: "Responden Survey", value: "347", icon: Users, color: "text-emerald-600 bg-emerald-100" },
];

export const metadata = {
  title: "Dashboard Admin",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Ringkasan aktivitas portal SPPG Penarukan 2.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
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
              Hasil Survey Terkini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span>Skor Kepuasan</span>
              <span className="font-semibold">4.3 / 5</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>NPS Score</span>
              <span className="font-semibold">82</span>
            </div>
            <div className="flex justify-between">
              <span>Total Responden</span>
              <span className="font-semibold">347</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>• Berita baru dipublikasikan: &quot;Program MBG Berjalan Lancar&quot;</p>
            <p>• 3 komentar baru menunggu moderasi</p>
            <p>• 2 masukan baru masuk hari ini</p>
            <p>• Survey kepuasan Juni 2026 aktif</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
