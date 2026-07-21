import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";
import {
  OrganolepticAdminListSection,
  OrganolepticAdminSummaryCards,
} from "@/components/admin/organoleptic-admin-sections";
import { Button } from "@/components/ui/button";
import { getOrganolepticOwnerFilter } from "@/lib/organoleptic-scope";
import {
  formatInspectionDateInput,
  normalizeInspectionDateRange,
} from "@/lib/organoleptic-meta";
import { isFullAdminRole, isOrganolepticEntryRole } from "@/lib/roles";

export const metadata = { title: "Uji Organoleptik" };

interface PageProps {
  searchParams: Promise<{ date?: string; dateEnd?: string; focus?: string }>;
}

function parseFocus(value?: string): "unsafe" | "returned" | null {
  if (value === "unsafe" || value === "returned") return value;
  return null;
}

export default async function AdminOrganoleptikPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const today = formatInspectionDateInput(new Date());
  const focus = parseFocus(params.focus);

  let range = normalizeInspectionDateRange(
    params.date ?? today,
    params.dateEnd ?? params.date ?? today
  ) ?? { from: today, to: today };

  // Dari badge notice: buka rentang 1 tahun agar temuan historis ikut terlihat
  if (focus && !params.date && !params.dateEnd) {
    const fromDate = new Date(`${today}T00:00:00.000Z`);
    fromDate.setUTCFullYear(fromDate.getUTCFullYear() - 1);
    range = {
      from: formatInspectionDateInput(fromDate),
      to: today,
    };
  }
  const createdById = getOrganolepticOwnerFilter(session?.user?.role, session?.user?.id);
  const showAllEntries = isFullAdminRole(session?.user?.role);
  const isEntryOnly = isOrganolepticEntryRole(session?.user?.role);

  return (
    <div className="space-y-6">
      <div>
        {!isEntryOnly && (
          <Link href="/admin/menu" prefetch={false} className="text-sm text-primary hover:underline">
            ← Kembali ke Kelola Menu
          </Link>
        )}
        <div className={`flex flex-wrap items-start justify-between gap-4 ${isEntryOnly ? "" : "mt-2"}`}>
          <div>
            <h2 className="text-2xl font-bold">Checklist Uji Organoleptik</h2>
            <p className="text-muted-foreground">
              Input dan arsip checklist harian — 1 lembar per sekolah/posyandu (1 paket = 5 item menu).
            </p>
          </div>
          <Link href="/admin/menu/organoleptik/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Input Checklist
            </Button>
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border bg-muted/40" />
            ))}
          </div>
        }
      >
        <OrganolepticAdminSummaryCards
          dateFrom={range.from}
          dateTo={range.to}
          createdById={createdById}
        />
      </Suspense>

      <Suspense fallback={<AdminCardSkeleton rows={5} />}>
        <OrganolepticAdminListSection
          dateFrom={range.from}
          dateTo={range.to}
          focus={focus}
          createdById={createdById}
          currentUserId={session?.user?.id}
          userRole={session?.user?.role}
          showAllEntries={showAllEntries}
        />
      </Suspense>
    </div>
  );
}
