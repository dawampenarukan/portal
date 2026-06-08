import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockComments } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Moderasi Komentar" };

export default function AdminKomentarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Moderasi Komentar</h2>
        <p className="text-muted-foreground">Tinjau dan moderasi komentar pembaca.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Komentar Menunggu Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockComments.map((comment) => (
            <div key={comment.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{comment.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.createdAt)}
                  </p>
                  <p className="mt-2 text-sm">{comment.content}</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm">Setujui</Button>
                <Button size="sm" variant="outline">
                  Tolak
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
