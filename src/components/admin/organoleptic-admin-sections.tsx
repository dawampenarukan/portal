import { OrganolepticChecklistList } from "@/components/admin/organoleptic-checklist-list";
import {
  getOrganolepticChecklists,
  getOrganolepticDailySummary,
} from "@/lib/organoleptic-queries";
import {
  formatOrganolepticPeriodLabel,
  ORGANOLEPTIC_LIST_DEFAULT_LIMIT,
} from "@/lib/organoleptic-meta";

type FocusFilter = "unsafe" | "returned" | null;

export async function OrganolepticAdminSummaryCards({
  dateFrom,
  dateTo,
  createdById,
}: {
  dateFrom: string;
  dateTo: string;
  createdById?: string;
}) {
  const summary = await getOrganolepticDailySummary(
    dateFrom,
    createdById,
    dateTo
  );
  const periodLabel = formatOrganolepticPeriodLabel(
    summary.date,
    summary.dateEnd
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <SummaryCard label="Periode" value={periodLabel} />
      <SummaryCard label="Lembar" value={String(summary.checklistCount)} />
      <SummaryCard label="Total item menu" value={String(summary.itemCount)} />
      <SummaryCard label="Aman" value={String(summary.safeCount)} />
      <SummaryCard label="Tidak aman" value={String(summary.unsafeCount)} />
    </div>
  );
}

export async function OrganolepticAdminListSection({
  dateFrom,
  dateTo,
  focus,
  createdById,
  currentUserId,
  userRole,
  showAllEntries,
}: {
  dateFrom: string;
  dateTo: string;
  focus: FocusFilter;
  createdById?: string;
  currentUserId?: string;
  userRole?: string | null;
  showAllEntries: boolean;
}) {
  const { checklists, truncated, limit } = await getOrganolepticChecklists({
    date: dateFrom,
    dateEnd: dateTo,
    createdById,
    focus,
    limit: ORGANOLEPTIC_LIST_DEFAULT_LIMIT,
  });

  return (
    <OrganolepticChecklistList
      initialChecklists={checklists}
      initialDate={dateFrom}
      initialDateEnd={dateTo}
      initialFocus={focus}
      initialTruncated={truncated}
      listLimit={limit}
      currentUserId={currentUserId}
      userRole={userRole}
      showAllEntries={showAllEntries}
    />
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
