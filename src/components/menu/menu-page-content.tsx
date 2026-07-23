"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { MenuFavorites } from "@/components/menu/menu-favorites";
import { MenuTopRequests } from "@/components/menu/menu-top-requests";
import { AtmPagePanel, AtmPageShell } from "@/components/layout/atm-page-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  MENU_CATEGORIES,
  MenuCategoryId,
  getMenuCategory,
  getMenuCategoryMeta,
} from "@/lib/menu-meta";
import type { MenuCategoryBundle, TopMenuRequestView } from "@/lib/types";
import { cn } from "@/lib/utils";

const MenuRequestForm = dynamic(
  () =>
    import("@/components/menu/menu-request-form").then((m) => m.MenuRequestForm),
  {
    loading: () => (
      <div
        className="h-56 animate-pulse rounded-xl bg-muted/60"
        aria-label="Memuat form request"
      />
    ),
  }
);

const TAB_IDLE_COLORS: Record<MenuCategoryId, string> = {
  "porsi-kecil":
    "border border-sky/35 bg-sky/25 text-sky-950 hover:bg-sky/40 hover:border-sky/50",
  "porsi-besar":
    "border border-sunny/45 bg-sunny/35 text-amber-900 hover:bg-sunny/50 hover:border-sunny/60",
  "ibu-hamil":
    "border border-lavender/35 bg-lavender/25 text-purple-900 hover:bg-lavender/40 hover:border-lavender/50",
  balita:
    "border border-secondary/45 bg-secondary/55 text-secondary-foreground hover:bg-secondary/75 hover:border-secondary/60",
};

interface MenuPageContentProps {
  initialCategory?: string;
  initialMenuData: MenuCategoryBundle;
  /** SSR from voter cookie — avoids /api/menu-votes/mine waterfall. */
  initialFavoritedIds?: string[];
}

function syncMenuCategoryUrl(id: MenuCategoryId) {
  if (typeof window === "undefined") return;
  const url = `/menu?kategori=${id}`;
  window.history.replaceState(window.history.state, "", url);
}

/** Soften ALL-CAPS inventory names for public display. */
function displayMenuName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length >= 4 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return trimmed
      .toLowerCase()
      .replace(/(^|[\s·-])(\S)/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
  }
  return trimmed;
}

export function MenuPageContent({
  initialCategory,
  initialMenuData,
  initialFavoritedIds = [],
}: MenuPageContentProps) {
  const activeIdDefault = getMenuCategory(initialCategory ?? "porsi-kecil");
  const [activeId, setActiveId] = useState<MenuCategoryId>(activeIdDefault);
  const [bundles, setBundles] = useState<
    Record<MenuCategoryId, MenuCategoryBundle | undefined>
  >(() => ({
    "porsi-kecil": activeIdDefault === "porsi-kecil" ? initialMenuData : undefined,
    "porsi-besar": activeIdDefault === "porsi-besar" ? initialMenuData : undefined,
    "ibu-hamil": activeIdDefault === "ibu-hamil" ? initialMenuData : undefined,
    balita: activeIdDefault === "balita" ? initialMenuData : undefined,
  }));
  const [loadingCategory, setLoadingCategory] = useState<MenuCategoryId | null>(null);
  const [favoritedIds] = useState<string[]>(initialFavoritedIds);

  const fetchCategoryData = useCallback(async (id: MenuCategoryId) => {
    const res = await fetch(`/api/menu-data?category=${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as MenuCategoryBundle;
  }, []);

  const prefetchCategory = useCallback(
    (id: MenuCategoryId) => {
      if (id === activeId || loadingCategory === id) return;
      void fetchCategoryData(id).then((data) => {
        if (data) setBundles((prev) => ({ ...prev, [id]: data }));
      });
    },
    [activeId, fetchCategoryData, loadingCategory]
  );

  const handleRequestSubmitted = useCallback(
    (topRequests: TopMenuRequestView[]) => {
      setBundles((prev) => {
        const current = prev[activeId];
        if (!current) return prev;
        return { ...prev, [activeId]: { ...current, topRequests } };
      });
    },
    [activeId]
  );

  const switchCategory = useCallback(
    async (id: MenuCategoryId) => {
      if (id === activeId && bundles[id] && loadingCategory !== id) {
        // Sudah di tab ini — tetap refresh diam-diam agar data admin terbaru masuk
        void fetchCategoryData(id).then((data) => {
          if (data) setBundles((prev) => ({ ...prev, [id]: data }));
        });
        return;
      }

      setActiveId(id);
      syncMenuCategoryUrl(id);

      // Tampilkan data cache segera bila ada, sambil fetch fresh
      const hadCache = Boolean(bundles[id]);
      if (!hadCache) setLoadingCategory(id);

      try {
        const data = await fetchCategoryData(id);
        if (data) {
          setBundles((prev) => ({ ...prev, [id]: data }));
        }
      } finally {
        setLoadingCategory(null);
      }
    },
    [activeId, bundles, fetchCategoryData, loadingCategory]
  );

  const category = getMenuCategoryMeta(activeId);
  const bundle = bundles[activeId];
  const favorites = bundle?.favorites ?? [];
  const thisWeek = bundle?.thisWeek ?? [];
  const topRequests = bundle?.topRequests ?? [];

  return (
    <AtmPageShell theme="menu" innerClassName="space-y-8">
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
        {MENU_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => switchCategory(cat.id)}
            onMouseEnter={() => prefetchCategory(cat.id)}
            onFocus={() => prefetchCategory(cat.id)}
            className={cn(
              "flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all",
              activeId === cat.id
                ? "bg-gradient-to-r from-primary to-[#3cb88a] text-white shadow-lg shadow-primary/30 ring-2 ring-white/60"
                : TAB_IDLE_COLORS[cat.id]
            )}
          >
            <span className="text-lg">{cat.emoji}</span>
            <span className="hidden sm:inline">{cat.label}</span>
            <span className="sm:hidden">{cat.shortLabel}</span>
          </button>
        ))}
      </div>

      <div
        className={cn(
          "atm-hero-banner rounded-3xl bg-gradient-to-r p-6 ring-2 ring-white/60 md:p-8",
          category.color
        )}
      >
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
        <AtmPagePanel variant="main" className="lg:col-span-3">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-coral/35 to-sunny/40 text-lg shadow-sm">
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
        </AtmPagePanel>

        <AtmPagePanel variant="sidebar" className="space-y-6 lg:col-span-2">
          <Card className="charming-card border-0 bg-white/75 backdrop-blur-sm">
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky/25 text-sm">
                  📅
                </span>
                Menu Minggu Ini
              </h3>
              {thisWeek.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada jadwal menu minggu ini.
                </p>
              ) : (
                <ul className="space-y-2">
                  {thisWeek.map((item) => (
                    <li
                      key={`${item.menuDate ?? item.dayLabel}-${item.menuText}`}
                      className="atm-stripe-item rounded-xl px-3 py-2.5"
                    >
                      <div className="flex gap-2.5">
                        <span
                          className="mt-0.5 shrink-0 text-base leading-none opacity-70"
                          aria-hidden
                        >
                          {item.emoji}
                        </span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs font-medium text-primary">
                            {item.heading}
                          </p>
                          <p className="text-sm leading-snug text-foreground/90">
                            {displayMenuName(item.menuText)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <MenuRequestForm category={category} onSubmitted={handleRequestSubmitted} />

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-sky/35 text-lg shadow-sm">
                🙋
              </span>
              Request Menu Terbanyak
            </h3>
            {loadingCategory === activeId ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted/60" />
                ))}
              </div>
            ) : (
              <MenuTopRequests key={`top-requests-${activeId}`} items={topRequests} />
            )}
          </div>
        </AtmPagePanel>
      </div>
    </AtmPageShell>
  );
}
