import { CardGridSkeleton } from "@/components/ui/route-skeletons";

export default function AdminEventLoading() {
  return <CardGridSkeleton count={6} cols="md:grid-cols-2 lg:grid-cols-3" />;
}
