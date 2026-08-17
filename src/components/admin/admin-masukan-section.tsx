import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackDeleteButton } from "@/components/admin/feedback-delete-button";
import { FeedbackPrintButton } from "@/components/admin/feedback-print-button";
import { PaginationNav } from "@/components/admin/pagination-nav";
import { getAdminFeedbacksList } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

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
    <Card className="print:border-0 print:bg-transparent print:shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 print:hidden">
        <CardTitle className="text-base">Daftar Masukan</CardTitle>
        <FeedbackPrintButton disabled={feedbacks.length === 0} />
      </CardHeader>
      <CardContent className="space-y-4 print:p-0">
        <div className="hidden print:mb-2 print:block">
          <h1 className="text-sm font-bold leading-tight">
            Daftar Masukan — SPPG Penarukan 2 · {feedbacks.length} entri
            {total > feedbacks.length ? ` (halaman ${page})` : ""}
          </h1>
        </div>

        {/* Mobile: cards */}
        <div className="space-y-3 md:hidden print:hidden">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{fb.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{fb.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fb.schoolLocation?.trim() || "—"} · {fb.category ?? "-"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(fb.createdAt)}
                  </p>
                </div>
                <Badge
                  variant={fb.status === "NEW" ? "popular" : "secondary"}
                  className="shrink-0"
                >
                  {statusLabel[fb.status] ?? fb.status}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <FeedbackDetail feedbackId={fb.id} />
                <FeedbackDeleteButton feedbackId={fb.id} title={fb.title} />
              </div>
            </div>
          ))}
          {feedbacks.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada masukan.</p>
          )}
        </div>

        {/* Desktop: table (layar) */}
        <div className="hidden overflow-x-auto md:block print:hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Pengirim</th>
                <th className="pb-3 pr-4 font-medium">Judul</th>
                <th className="pb-3 pr-4 font-medium">Kategori</th>
                <th className="pb-3 pr-4 font-medium">Tanggal</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb) => (
                <tr key={fb.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <p>{fb.name}</p>
                    {fb.schoolLocation?.trim() ? (
                      <p className="text-xs text-muted-foreground">
                        {fb.schoolLocation}
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-xs truncate py-3 pr-4 font-medium">
                    {fb.title}
                  </td>
                  <td className="py-3 pr-4">{fb.category ?? "-"}</td>
                  <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">
                    {formatDate(fb.createdAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={fb.status === "NEW" ? "popular" : "secondary"}>
                      {statusLabel[fb.status] ?? fb.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <FeedbackDetail feedbackId={fb.id} />
                      <FeedbackDeleteButton feedbackId={fb.id} title={fb.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {feedbacks.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">Belum ada masukan.</p>
          )}
        </div>

        {/* Cetak saja: tabel padat */}
        {feedbacks.length > 0 ? (
          <div className="hidden print:block" id="masukan-print-list">
            <table className="w-full border-collapse text-left text-[9px] leading-tight">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">No</th>
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">
                    Tanggal
                  </th>
                  <th className="px-1 py-0.5 font-semibold">Pengirim</th>
                  <th className="px-1 py-0.5 font-semibold">Sekolah/Posyandu</th>
                  <th className="px-1 py-0.5 font-semibold">Judul</th>
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">
                    Kategori
                  </th>
                  <th className="whitespace-nowrap px-1 py-0.5 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb, index) => (
                  <tr key={fb.id} className="border-b border-border/80">
                    <td className="whitespace-nowrap px-1 py-0.5">{index + 1}</td>
                    <td className="whitespace-nowrap px-1 py-0.5">
                      {formatDate(fb.createdAt)}
                    </td>
                    <td className="px-1 py-0.5 font-medium">{fb.name}</td>
                    <td className="px-1 py-0.5">
                      {fb.schoolLocation?.trim() || "—"}
                    </td>
                    <td className="px-1 py-0.5">{fb.title}</td>
                    <td className="whitespace-nowrap px-1 py-0.5">
                      {fb.category ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-1 py-0.5">
                      {statusLabel[fb.status] ?? fb.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="print:hidden">
          <PaginationNav basePath="/admin/masukan" page={page} total={total} />
        </div>
      </CardContent>
    </Card>
  );
}
