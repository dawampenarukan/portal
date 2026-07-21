"use client";

import dynamic from "next/dynamic";
import type { OrganolepticChecklistView } from "@/lib/types";

const OrganolepticForm = dynamic(
  () =>
    import("@/components/admin/organoleptic-form").then((m) => m.OrganolepticForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-2xl bg-muted/60" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/50" />
          ))}
        </div>
        <div className="h-56 rounded-xl bg-muted/50" />
        <div className="h-40 rounded-xl bg-muted/50" />
      </div>
    ),
  }
);

interface Props {
  initialData?: OrganolepticChecklistView;
  readOnly?: boolean;
}

/** Dynamic import form berat — kurangi JS awal halaman admin organoleptik. */
export function OrganolepticFormLoader(props: Props) {
  return <OrganolepticForm {...props} />;
}
