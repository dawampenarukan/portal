import { CardGridSkeleton, HeroSkeleton, ListSkeleton, PageHeaderSkeleton } from "@/components/ui/route-skeletons";

export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-8 px-4 py-8">
      <HeroSkeleton />
      <CardGridSkeleton count={4} />
      <ListSkeleton rows={4} />
    </div>
  );
}
