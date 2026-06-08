import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MENU_CATEGORIES } from "@/lib/menu-meta";
import { getAdminMenuOverview } from "@/lib/queries";

export async function AdminMenuOverview() {
  const overview = await getAdminMenuOverview();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {MENU_CATEGORIES.map((cat) => {
        const data = overview[cat.id];
        const topFavorite = data.topFavorite;

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
                <span className="font-medium">Menu minggu ini:</span> {data.weeklyCount} hari
                terjadwal
              </p>
              <div className="flex gap-2">
                {data.newRequests > 0 && (
                  <Badge variant="secondary">{data.newRequests} request baru</Badge>
                )}
                <Link
                  href={`/admin/menu/${cat.id}`}
                  prefetch={false}
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
  );
}
