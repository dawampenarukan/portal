import { AdminSidebar } from "@/components/layout/admin-sidebar";
import {
  getNewFeedbackCountCached,
  getOrganolepticAdminNoticesCached,
} from "@/lib/cached-queries";
import { safeQuery } from "@/lib/safe-db";

/**
 * Fetch badge admin secara async — dibungkus Suspense di layout
 * agar shell sidebar tidak menunggu DB.
 * Notices organoleptik pakai cache 15s + ORGANOLEPTIC_TAG (bust on mutate).
 */
export async function AdminSidebarWithBadges({
  isSuperAdmin,
}: {
  isSuperAdmin: boolean;
}) {
  const [newFeedbackCount, organolepticNotices] = await Promise.all([
    safeQuery(() => getNewFeedbackCountCached(), 0, "getNewFeedbackCount"),
    safeQuery(
      () => getOrganolepticAdminNoticesCached(),
      { unsafeCount: 0, returnedPackagesCount: 0 },
      "getOrganolepticAdminNotices"
    ),
  ]);

  return (
    <AdminSidebar
      newFeedbackCount={newFeedbackCount}
      organolepticNotices={organolepticNotices}
      isSuperAdmin={isSuperAdmin}
    />
  );
}

export function AdminSidebarFallback({
  isSuperAdmin,
}: {
  isSuperAdmin: boolean;
}) {
  return <AdminSidebar isSuperAdmin={isSuperAdmin} />;
}
