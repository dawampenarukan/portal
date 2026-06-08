"use client";

import { useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FavoriteMenuView } from "@/lib/types";

interface MenuFavoritesProps {
  favorites: FavoriteMenuView[];
  favoritedIds: string[];
}

function FavoriteRow({
  menu,
  rank,
  maxVotes,
  isFav,
  loading,
  onToggle,
}: {
  menu: FavoriteMenuView;
  rank: number;
  maxVotes: number;
  isFav: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  const percent = Math.round((menu.votes / maxVotes) * 100);

  return (
    <Card className="charming-card shrink-0 border-0">
      <CardContent className="flex gap-3 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl">
          {menu.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">
                {rank}
              </span>
              <span className="font-extrabold">{menu.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-primary">
                ❤️ {menu.votes}
              </span>
              <Button
                type="button"
                size="sm"
                variant={isFav ? "default" : "outline"}
                disabled={loading}
                onClick={onToggle}
                className={cn("gap-1.5 rounded-full", isFav && "bg-coral hover:bg-coral/90")}
                aria-pressed={isFav}
                aria-label={isFav ? "Batalkan favorit" : "Tandai favorit"}
              >
                <Heart className={cn("h-4 w-4", isFav && "fill-current")} />
                {isFav ? "Favorit" : "Suka"}
              </Button>
            </div>
          </div>
          {menu.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{menu.description}</p>
          )}
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
}

export function MenuFavorites({ favorites: initialFavorites, favoritedIds }: MenuFavoritesProps) {
  const [items, setItems] = useState(initialFavorites);
  const [favorited, setFavorited] = useState(() => new Set(favoritedIds));
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const maxVotes = useMemo(() => Math.max(1, ...items.map((m) => m.votes)), [items]);
  const hasMore = items.length > 5;

  async function toggleFavorite(menuId: string) {
    setLoadingId(menuId);
    try {
      const res = await fetch(`/api/menu-items/${menuId}/vote`, { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { votes: number; isFavorited: boolean };
      setItems((prev) => {
        const updated = prev.map((m) => (m.id === menuId ? { ...m, votes: data.votes } : m));
        return [...updated].sort((a, b) => b.votes - a.votes);
      });
      setFavorited((prev) => {
        const next = new Set(prev);
        if (data.isFavorited) next.add(menuId);
        else next.delete(menuId);
        return next;
      });
    } finally {
      setLoadingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada menu untuk dipilih. Menu favorit otomatis muncul dari jadwal mingguan SPPG.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tekan ❤️ untuk menandai favorit. Semua menu yang pernah disajikan bisa kamu pilih.
      </p>

      <div className="relative">
        <div
          className={cn(
            "space-y-3 overflow-y-auto overscroll-contain scroll-smooth pr-1",
            hasMore && "max-h-[38rem]"
          )}
          style={{ scrollbarGutter: "stable" }}
        >
          {items.map((menu, index) => (
            <FavoriteRow
              key={menu.id}
              menu={menu}
              rank={index + 1}
              maxVotes={maxVotes}
              isFav={favorited.has(menu.id)}
              loading={loadingId === menu.id}
              onToggle={() => toggleFavorite(menu.id)}
            />
          ))}
        </div>

        {hasMore && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background via-background/70 to-transparent"
          />
        )}
      </div>
    </div>
  );
}
