import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";
import { MENU_CATEGORY_ID_TO_TYPE, type MenuCategoryId } from "@/lib/menu-meta";
import { getMenuRequests } from "@/lib/queries";
import type { MenuRequestView } from "@/lib/types";

const MenuRequestsManager = dynamic(
  () =>
    import("@/components/admin/menu-requests-manager").then((m) => m.MenuRequestsManager),
  { loading: () => <AdminCardSkeleton rows={3} /> }
);

export async function AdminMenuRequestsSection({
  categoryId,
}: {
  categoryId: MenuCategoryId;
}) {
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  const rows = await getMenuRequests(categoryType, 30);
  const requests: MenuRequestView[] = rows.map((r) => ({
    id: r.id,
    requesterName: r.requesterName,
    menuName: r.menuName,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <Card>
      <CardContent className="p-6">
        <MenuRequestsManager initialRequests={requests} />
      </CardContent>
    </Card>
  );
}
