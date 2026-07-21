import { Suspense } from "react";
import { BeritaCategoryFilter } from "@/components/news/berita-category-filter";
import { BeritaFilterKeyed } from "@/components/news/berita-filter-keyed";
import {
  BeritaArticleListFromParams,
  BeritaPopularAside,
} from "@/components/news/berita-page-sections";
import {
  AtmPageHeader,
  AtmPageShell,
} from "@/components/layout/atm-page-shell";
import { ListSkeleton } from "@/components/ui/route-skeletons";

export const metadata = {
  title: "Berita",
};

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<{ kategori?: string }>;
}

export default function BeritaPage({ searchParams }: PageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <AtmPageHeader
        theme="berita"
        emoji="📰"
        title="Berita & Informasi"
        description="Berita harian, kegiatan, dan pengumuman terbaru dari SPPG Penarukan 2."
      />

      <AtmPageShell theme="berita" innerClassName="space-y-6">
        <Suspense
          fallback={
            <div className="h-8 w-64 animate-pulse rounded-full bg-muted" />
          }
        >
          <BeritaCategoryFilter />
        </Suspense>

        <div className="grid gap-8 lg:grid-cols-3">
          <Suspense fallback={<ListSkeleton rows={8} />}>
            <BeritaFilterKeyed>
              <BeritaArticleListFromParams searchParams={searchParams} />
            </BeritaFilterKeyed>
          </Suspense>
          <Suspense fallback={<ListSkeleton rows={4} />}>
            <BeritaPopularAside />
          </Suspense>
        </div>
      </AtmPageShell>
    </div>
  );
}
