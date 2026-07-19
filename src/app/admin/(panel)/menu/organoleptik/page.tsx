import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";
import { OrganolepticChecklistList } from "@/components/admin/organoleptic-checklist-list";
import { Button } from "@/components/ui/button";
import {
  getOrganolepticChecklists,
  getOrganolepticDailySummary,
} from "@/lib/organoleptic-queries";
import { getOrganolepticOwnerFilter } from "@/lib/organoleptic-scope";
import {
  formatInspectionDateInput,
  formatOrganolepticPeriodLabel,
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

  const [summary, checklists] = await Promise.all([
    getOrganolepticDailySummary(range.from, createdById, range.to),
    getOrganolepticChecklists({
      date: range.from,
      dateEnd: range.to,
      createdById,
    }),
  ]);

  const periodLabel = formatOrganolepticPeriodLabel(summary.date, summary.dateEnd);

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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Periode" value={periodLabel} />
        <SummaryCard label="Lembar" value={String(summary.checklistCount)} />
        <SummaryCard label="Total item menu" value={String(summary.itemCount)} />
        <SummaryCard label="Aman" value={String(summary.safeCount)} />
        <SummaryCard label="Tidak aman" value={String(summary.unsafeCount)} />
      </div>

      <Suspense fallback={<AdminCardSkeleton rows={5} />}>
        <OrganolepticChecklistList
          initialChecklists={checklists}
          initialDate={range.from}
          initialDateEnd={range.to}
          initialFocus={focus}
          currentUserId={session?.user?.id}
          userRole={session?.user?.role}
          showAllEntries={showAllEntries}
        />
      </Suspense>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold leading-snug">{value}</p>
    </div>
  );
}
