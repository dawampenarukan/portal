import { Suspense } from "react";
import { MenuPageBody } from "@/components/menu/menu-page-sections";
import { AtmPageHeader } from "@/components/layout/atm-page-shell";
import { CardGridSkeleton } from "@/components/ui/route-skeletons";

export const revalidate = 30;

export const metadata = {
  title: "Menu Favorit & Request",
  description:
    "Lihat menu favorit dan ajukan request menu sesuai Kategori Porsi Rencana Produksi: Porsi besar, Porsi kecil, Posyandu Bumil Busui, dan Posyandu Balita.",
};

interface PageProps {
  searchParams: Promise<{ kategori?: string }>;
}

function MenuBodyFallback() {
  return (
    <div className="mt-2 space-y-8 animate-pulse">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-28 shrink-0 rounded-full bg-muted" />
        ))}
      </div>
      <div className="h-32 rounded-3xl bg-muted/60" />
      <CardGridSkeleton count={4} cols="lg:grid-cols-5" />
    </div>
  );
}

export default function MenuPage({ searchParams }: PageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <AtmPageHeader
        theme="menu"
        emoji="🍽️"
        title="Menu Favorit & Request"
        description="Lihat menu yang paling disukai dan ajukan menu impianmu! Tersedia untuk siswa SD, SMP, ibu hamil, dan balita."
      />

      <Suspense fallback={<MenuBodyFallback />}>
        <MenuPageBody searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
