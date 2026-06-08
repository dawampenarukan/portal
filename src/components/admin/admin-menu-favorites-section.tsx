import { Card, CardContent } from "@/components/ui/card";
import { MenuFavoritesSummary } from "@/components/admin/menu-favorites-summary";
import { getAdminMenuItems } from "@/lib/queries";
import type { MenuCategoryId } from "@/lib/menu-meta";

export async function AdminMenuFavoritesSection({
  categoryId,
}: {
  categoryId: MenuCategoryId;
}) {
  const items = await getAdminMenuItems(categoryId);

  return (
    <Card>
      <CardContent className="p-6">
        <MenuFavoritesSummary items={items} />
      </CardContent>
    </Card>
  );
}
