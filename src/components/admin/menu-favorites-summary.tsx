import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MenuItemAdminView } from "@/lib/types";

interface MenuFavoritesSummaryProps {
  items: MenuItemAdminView[];
}

function FavoriteSummaryRow({
  item,
  rank,
}: {
  item: MenuItemAdminView;
  rank: number;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 rounded-lg border bg-primary/5 px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {rank}
        </span>
        <span className="truncate font-medium">
          {item.emoji ?? "🍽️"} {item.name}
        </span>
      </span>
      <Badge variant="outline" className="shrink-0">
        ❤️ {item.votes}
      </Badge>
    </div>
  );
}

export function MenuFavoritesSummary({ items }: MenuFavoritesSummaryProps) {
  const sorted = [...items].sort((a, b) => b.votes - a.votes);
  const hasMore = sorted.length > 5;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Menu Favorit (Akumulasi)</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Daftar otomatis dari jadwal mingguan. Suara ❤️ ditambahkan pengunjung di halaman
          /menu — tidak perlu dikelola manual.
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada menu. Tambahkan jadwal di &quot;Menu Minggu Ini&quot; terlebih dahulu.
        </p>
      ) : (
        <div className="relative">
          <div
            className={cn(
              "space-y-2 overflow-y-auto overscroll-contain scroll-smooth pr-1",
              hasMore && "max-h-[18rem]"
            )}
            style={{ scrollbarGutter: "stable" }}
          >
            {sorted.map((item, index) => (
              <FavoriteSummaryRow key={item.id} item={item} rank={index + 1} />
            ))}
          </div>

          {hasMore && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card via-card/70 to-transparent"
            />
          )}
        </div>
      )}
    </div>
  );
}
