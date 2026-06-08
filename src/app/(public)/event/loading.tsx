import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/ui/route-skeletons";

export default function EventLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <CardGridSkeleton count={3} cols="md:grid-cols-2 lg:grid-cols-3" />
      </div>
    </div>
  );
}
