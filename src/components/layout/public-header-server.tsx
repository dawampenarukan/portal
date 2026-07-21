import { auth } from "@/auth";
import { PublicHeader } from "@/components/layout/public-header";
import { getOrganolepticAdminNoticesCached } from "@/lib/cached-queries";
import { isFullAdminRole } from "@/lib/roles";
import { safeQuery } from "@/lib/safe-db";

export async function PublicHeaderServer() {
  const session = await auth();
  const isAdmin = isFullAdminRole(session?.user?.role);

  const organolepticNotices = isAdmin
    ? await safeQuery(
        () => getOrganolepticAdminNoticesCached(),
        { unsafeCount: 0, returnedPackagesCount: 0 },
        "getOrganolepticAdminNotices"
      )
    : null;

  return <PublicHeader organolepticNotices={organolepticNotices} />;
}
