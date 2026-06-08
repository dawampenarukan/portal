import { CardGridSkeleton } from "@/components/ui/route-skeletons";

export default function AdminPublikasiLoading() {
  return <CardGridSkeleton count={4} cols="md:grid-cols-2" />;
}
