"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/route-skeletons";
import { DeferUntilVisible } from "@/components/ui/defer-until-visible";
import type { OrganolepticPublicView } from "@/lib/types";

const OrganolepticWidget = dynamic(
  () =>
    import("@/components/dashboard/organoleptic-widget").then((m) => m.OrganolepticWidget),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export function OrganolepticWidgetLoader({ data }: { data: OrganolepticPublicView }) {
  return (
    <DeferUntilVisible fallback={<ChartSkeleton />}>
      <OrganolepticWidget data={data} />
    </DeferUntilVisible>
  );
}
