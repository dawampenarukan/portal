import { ListSkeleton, PageHeaderSkeleton } from "@/components/ui/route-skeletons";

export default function BeritaLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      <PageHeaderSkeleton />
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListSkeleton rows={8} />
        </div>
        <ListSkeleton rows={4} />
      </div>
    </div>
  );
}
