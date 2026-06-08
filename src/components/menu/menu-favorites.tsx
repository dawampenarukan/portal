import type { FavoriteMenuView } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

interface MenuFavoritesProps {
  favorites: FavoriteMenuView[];
}

export function MenuFavorites({ favorites }: MenuFavoritesProps) {
  const maxVotes = favorites[0]?.votes ?? 1;

  return (
    <div className="space-y-3">
      {favorites.map((menu, index) => {
        const percent = Math.round((menu.votes / maxVotes) * 100);

        return (
          <Card key={menu.id} className="charming-card border-0">
            <CardContent className="flex gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl">
                {menu.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">
                      {index + 1}
                    </span>
                    <span className="font-extrabold">{menu.name}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-primary">
                    ❤️ {menu.votes}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{menu.description}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-[#3cb88a] transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
