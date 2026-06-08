import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MENU_CATEGORIES, MENU_DATA } from "@/lib/menu-data";

export const metadata = { title: "Kelola Menu" };

export default function AdminMenuPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kelola Menu</h2>
          <p className="text-muted-foreground">
            Atur menu favorit, jadwal mingguan, dan tinjau request menu dari pengunjung.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Tambah Menu
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MENU_CATEGORIES.map((cat) => {
          const data = MENU_DATA[cat.id];
          const topFavorite = data.favorites[0];

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
                <p>
                  <span className="font-medium">Favorit #1:</span> {topFavorite.name} (
                  {topFavorite.votes} suara)
                </p>
                <p>
                  <span className="font-medium">Menu minggu ini:</span>{" "}
                  {data.thisWeek.length} hari terjadwal
                </p>
                <div className="flex gap-2">
                  <Badge variant="secondary">3 request baru</Badge>
                  <Button variant="outline" size="sm">
                    Kelola
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
