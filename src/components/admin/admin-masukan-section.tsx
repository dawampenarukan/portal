import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaginationNav } from "@/components/admin/pagination-nav";
import { getAdminFeedbacksList } from "@/lib/queries";

const FeedbackDetail = dynamic(
  () => import("@/components/admin/feedback-detail").then((m) => m.FeedbackDetail),
  { loading: () => <span className="text-xs text-muted-foreground">Memuat…</span> }
);

const statusLabel: Record<string, string> = {
  NEW: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  REJECTED: "Ditolak",
};

export async function AdminMasukanList({ page }: { page: number }) {
  const { items: feedbacks, total } = await getAdminFeedbacksList(page);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daftar Masukan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mobile: cards */}
        <div className="space-y-3 md:hidden">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{fb.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{fb.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fb.category ?? "-"}
                  </p>
                </div>
                <Badge
                  variant={fb.status === "NEW" ? "popular" : "secondary"}
                  className="shrink-0"
                >
                  {statusLabel[fb.status] ?? fb.status}
                </Badge>
              </div>
              <div className="mt-3">
                <FeedbackDetail feedbackId={fb.id} />
              </div>
            </div>
          ))}
          {feedbacks.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada masukan.</p>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto md:block">
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
                  <td className="max-w-xs truncate py-3 pr-4 font-medium">
                    {fb.title}
                  </td>
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
  );
}
