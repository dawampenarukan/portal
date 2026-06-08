import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaginationNav } from "@/components/admin/pagination-nav";
import { getAdminCommentsList } from "@/lib/queries";
import { formatRelativeTime } from "@/lib/utils";

const CommentActions = dynamic(
  () => import("@/components/admin/comment-actions").then((m) => m.CommentActions),
  { loading: () => <span className="text-xs text-muted-foreground">Memuat…</span> }
);

export async function AdminKomentarList({ page }: { page: number }) {
  const { items: comments, total } = await getAdminCommentsList(page);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Semua Komentar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Belum ada komentar.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{comment.authorName}</p>
                <p className="text-xs text-muted-foreground">
                  {comment.articleTitle} · {formatRelativeTime(comment.createdAt)}
                </p>
                <p className="mt-2 text-sm">{comment.content}</p>
                {comment.replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 pl-3">
                    {comment.replies.map((r) => (
                      <div key={r.id} className="text-sm">
                        <p className="font-medium">{r.authorName}</p>
                        <p className="text-muted-foreground">{r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Badge variant={comment.isApproved ? "success" : "secondary"}>
                {comment.isApproved ? "Disetujui" : "Pending"}
              </Badge>
            </div>
            <CommentActions commentId={comment.id} isApproved={comment.isApproved ?? false} />
          </div>
        ))}
        <PaginationNav basePath="/admin/komentar" page={page} total={total} />
      </CardContent>
    </Card>
  );
}
