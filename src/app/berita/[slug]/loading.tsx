import { HeroSkeleton, ListSkeleton } from "@/components/ui/route-skeletons";

export default function BeritaDetailLoading() {
  return (
    <article className="mx-auto max-w-3xl animate-pulse px-4 py-8">
      <div className="mb-4 h-6 w-24 rounded bg-muted" />
      <div className="h-10 w-full rounded-lg bg-muted" />
      <div className="mt-3 h-4 w-48 rounded bg-muted/70" />
      <HeroSkeleton />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full rounded bg-muted/60" />
        <div className="h-4 w-full rounded bg-muted/60" />
        <div className="h-4 w-3/4 rounded bg-muted/60" />
      </div>
      <div className="mt-10">
        <ListSkeleton rows={3} />
      </div>
    </article>
  );
}
