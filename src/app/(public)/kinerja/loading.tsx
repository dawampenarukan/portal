import { ChartSkeleton, PageHeaderSkeleton } from "@/components/ui/route-skeletons";

export default function KinerjaLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8">
      <PageHeaderSkeleton />
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  );
}
