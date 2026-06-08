import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockFeedbacks = [
  {
    id: "1",
    name: "Ahmad Rizki",
    title: "Saran peningkatan distribusi",
    category: "Saran",
    status: "NEW",
  },
  {
    id: "2",
    name: "Dewi Lestari",
    title: "Laporan kondisi dapur",
    category: "Laporan Temuan",
    status: "IN_PROGRESS",
  },
];

export const metadata = { title: "Inbox Masukan" };

export default function AdminMasukanPage() {
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
                {mockFeedbacks.map((fb) => (
                  <tr key={fb.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{fb.name}</td>
                    <td className="py-3 pr-4 font-medium">{fb.title}</td>
                    <td className="py-3 pr-4">{fb.category}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={fb.status === "NEW" ? "popular" : "secondary"}>
                        {fb.status === "NEW" ? "Baru" : "Diproses"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm">
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
