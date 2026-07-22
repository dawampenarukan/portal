import { CardGridSkeleton, HeroSkeleton, ListSkeleton } from "@/components/ui/route-skeletons";
import { PublicShell } from "@/components/layout/public-shell";

export default function HomeLoading() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl animate-pulse space-y-8 px-4 py-8">
        <HeroSkeleton />
        <CardGridSkeleton count={4} />
        <ListSkeleton rows={4} />
      </div>
    </PublicShell>
  );
}
