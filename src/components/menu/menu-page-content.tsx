"use client";

import { useCallback, useEffect, useState } from "react";
import { MenuFavorites } from "@/components/menu/menu-favorites";
import { MenuRequestForm } from "@/components/menu/menu-request-form";
import { Card, CardContent } from "@/components/ui/card";
import {
  MENU_CATEGORIES,
  MenuCategoryId,
  getMenuCategory,
  getMenuCategoryMeta,
} from "@/lib/menu-meta";
import type { MenuCategoryBundle } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MenuPageContentProps {
  initialCategory?: string;
  initialMenuData: MenuCategoryBundle;
}

export function MenuPageContent({
  initialCategory,
  initialMenuData,
}: MenuPageContentProps) {
  const activeIdDefault = getMenuCategory(initialCategory ?? "porsi-kecil");
  const [activeId, setActiveId] = useState<MenuCategoryId>(activeIdDefault);
  const [bundles, setBundles] = useState<Record<MenuCategoryId, MenuCategoryBundle | undefined>>({
    [activeIdDefault]: initialMenuData,
  });
  const [loadingCategory, setLoadingCategory] = useState<MenuCategoryId | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/menu-votes/mine")
      .then((res) => (res.ok ? res.json() : { favoritedIds: [] }))
      .then((data: { favoritedIds: string[] }) => setFavoritedIds(data.favoritedIds ?? []))
      .catch(() => setFavoritedIds([]));
  }, []);

  const prefetchCategory = useCallback(
    (id: MenuCategoryId) => {
      if (bundles[id]) return;
      fetch(`/api/menu-data?category=${id}`).then(async (res) => {
        if (res.ok) {
          const data = (await res.json()) as MenuCategoryBundle;
          setBundles((prev) => (prev[id] ? prev : { ...prev, [id]: data }));
        }
      });
    },
    [bundles]
  );

  const switchCategory = useCallback(
    async (id: MenuCategoryId) => {
      setActiveId(id);
      if (bundles[id]) return;

      setLoadingCategory(id);
      try {
        const res = await fetch(`/api/menu-data?category=${id}`);
        if (res.ok) {
          const data = (await res.json()) as MenuCategoryBundle;
          setBundles((prev) => ({ ...prev, [id]: data }));
        }
      } finally {
        setLoadingCategory(null);
      }
    },
    [bundles]
  );

  const category = getMenuCategoryMeta(activeId);
  const bundle = bundles[activeId];
  const favorites = bundle?.favorites ?? [];
  const thisWeek = bundle?.thisWeek ?? [];

  return (
    <div className="space-y-8">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MENU_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => switchCategory(cat.id)}
            onMouseEnter={() => prefetchCategory(cat.id)}
            onFocus={() => prefetchCategory(cat.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all",
              activeId === cat.id
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-white text-foreground/80 hover:bg-accent"
            )}
          >
            <span className="text-lg">{cat.emoji}</span>
            <span className="hidden sm:inline">{cat.label}</span>
            <span className="sm:hidden">{cat.shortLabel}</span>
          </button>
        ))}
      </div>

      <div className={cn("rounded-3xl bg-gradient-to-r p-6 md:p-8", category.color)}>
        <div className="flex items-start gap-4">
          <span className="text-5xl">{category.emoji}</span>
          <div>
            <h2 className="text-xl font-extrabold md:text-2xl">{category.label}</h2>
            <p className="mt-1 text-sm font-semibold text-primary/80">
              Untuk: {category.audience}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/80">
              {category.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral/20 text-lg">
              ❤️
            </span>
            Menu Favorit
          </h3>
          {loadingCategory === activeId ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted/60" />
              ))}
            </div>
          ) : (
            <MenuFavorites
              key={activeId}
              favorites={favorites}
              favoritedIds={favoritedIds}
            />
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="charming-card border-0">
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-extrabold">📅 Menu Minggu Ini</h3>
              <ul className="space-y-2">
                {thisWeek.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl bg-accent/60 px-3 py-2 text-sm font-medium text-accent-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <MenuRequestForm category={category} />
        </div>
      </div>
    </div>
  );
}
