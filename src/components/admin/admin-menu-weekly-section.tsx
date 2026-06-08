import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { AdminCardSkeleton } from "@/components/admin/admin-card-skeleton";
import { getAdminWeeklyMenu } from "@/lib/queries";
import type { MenuCategoryId } from "@/lib/menu-meta";

const WeeklyMenuManager = dynamic(
  () =>
    import("@/components/admin/weekly-menu-manager").then((m) => m.WeeklyMenuManager),
  { loading: () => <AdminCardSkeleton rows={6} /> }
);

export async function AdminMenuWeeklySection({ categoryId }: { categoryId: MenuCategoryId }) {
  const weekly = await getAdminWeeklyMenu(categoryId);

  return (
    <Card>
      <CardContent className="p-6">
        <WeeklyMenuManager categoryId={categoryId} initialEntries={weekly} />
      </CardContent>
    </Card>
  );
}
