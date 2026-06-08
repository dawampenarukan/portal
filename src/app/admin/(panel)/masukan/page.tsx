import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackDetail } from "@/components/admin/feedback-detail";
import { PaginationNav } from "@/components/admin/pagination-nav";
import { getAdminFeedbacksList } from "@/lib/queries";
import { parsePage } from "@/lib/pagination";

export const metadata = { title: "Inbox Masukan" };

const statusLabel: Record<string, string> = {
  NEW: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  REJECTED: "Ditolak",
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AdminMasukanPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const { items: feedbacks, total } = await getAdminFeedbacksList(page);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inbox Masukan</h2>
        <p className="text-muted-foreground">
          Kelola masukan, kritik, dan laporan temuan dari masyarakat.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Masukan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Pengirim</th>
                  <th className="pb-3 pr-4 font-medium">Judul</th>
                  <th className="pb-3 pr-4 font-medium">Kategori</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb) => (
                  <tr key={fb.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{fb.name}</td>
                    <td className="py-3 pr-4 font-medium">{fb.title}</td>
                    <td className="py-3 pr-4">{fb.category ?? "-"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={fb.status === "NEW" ? "popular" : "secondary"}>
                        {statusLabel[fb.status] ?? fb.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <FeedbackDetail feedbackId={fb.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationNav basePath="/admin/masukan" page={page} total={total} />
        </CardContent>
      </Card>
    </div>
  );
}
