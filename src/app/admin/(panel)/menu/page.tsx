import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MENU_CATEGORIES } from "@/lib/menu-meta";
import { getAllMenuData, getMenuRequestCounts } from "@/lib/queries";

export const metadata = { title: "Kelola Menu" };

export default async function AdminMenuPage() {
  const [menuData, requestCounts] = await Promise.all([
    getAllMenuData(),
    getMenuRequestCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Kelola Menu</h2>
        <p className="text-muted-foreground">
          Atur menu favorit, jadwal mingguan, dan tinjau request menu dari pengunjung.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MENU_CATEGORIES.map((cat) => {
          const data = menuData[cat.id];
          const topFavorite = data.favorites[0];
          const newRequests = requestCounts[cat.id];

          return (
            <Card key={cat.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span>{cat.emoji}</span>
                  {cat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{cat.audience}</p>
                {topFavorite ? (
                  <p>
                    <span className="font-medium">Favorit #1:</span> {topFavorite.name} (
                    {topFavorite.votes} suara)
                  </p>
                ) : (
                  <p className="text-muted-foreground">Belum ada menu favorit</p>
                )}
                <p>
                  <span className="font-medium">Menu minggu ini:</span>{" "}
                  {data.thisWeek.length} hari terjadwal
                </p>
                <div className="flex gap-2">
                  {newRequests > 0 && (
                    <Badge variant="secondary">{newRequests} request baru</Badge>
                  )}
                  <Link
                    href={`/admin/menu/${cat.id}`}
                    className="inline-flex h-9 items-center rounded-full border-2 border-primary/30 px-4 text-xs font-bold hover:bg-accent"
                  >
                    Kelola
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
