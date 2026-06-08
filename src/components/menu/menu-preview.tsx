import Link from "next/link";
import { MENU_CATEGORIES, MenuCategoryId } from "@/lib/menu-meta";
import { getMenuPreviewTopItemsCached } from "@/lib/cached-queries";
import { safeQuery } from "@/lib/safe-db";
import { Card, CardContent } from "@/components/ui/card";

const emptyTopItems = Object.fromEntries(
  MENU_CATEGORIES.map((c) => [c.id, null])
) as Record<MenuCategoryId, { emoji: string; name: string } | null>;

export async function MenuPreview() {
  const topItems = await safeQuery(
    () => getMenuPreviewTopItemsCached(),
    emptyTopItems,
    "getMenuPreviewTopItems"
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {MENU_CATEGORIES.map((cat) => {
        const topMenu = topItems[cat.id];

        return (
          <Link key={cat.id} href={`/menu?kategori=${cat.id}`} prefetch={true}>
            <Card className="charming-card group h-full border-0">
              <CardContent className="p-5">
                <span className="text-3xl">{cat.emoji}</span>
                <h3 className="mt-2 font-extrabold group-hover:text-primary">{cat.shortLabel}</h3>
                <p className="text-xs font-medium text-muted-foreground">{cat.audience}</p>
                {topMenu ? (
                  <p className="mt-3 rounded-xl bg-accent/60 px-3 py-2 text-xs font-semibold text-accent-foreground">
                    ❤️ Favorit: {topMenu.emoji} {topMenu.name}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Belum ada data menu</p>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
