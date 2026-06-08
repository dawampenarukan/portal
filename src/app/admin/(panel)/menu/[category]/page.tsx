import { notFound } from "next/navigation";
import { MenuAdminPanel } from "@/components/admin/menu-admin-panel";
import { MENU_CATEGORIES, MenuCategoryId } from "@/lib/menu-meta";
import { getMenuItemsByCategory, getWeeklyMenuEntries } from "@/lib/queries";

export const metadata = { title: "Kelola Menu Kategori" };

type Props = { params: Promise<{ category: string }> };

export default async function AdminMenuCategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = MENU_CATEGORIES.find((c) => c.id === category);
  if (!cat) notFound();

  const [items, weekly] = await Promise.all([
    getMenuItemsByCategory(category as MenuCategoryId),
    getWeeklyMenuEntries(category as MenuCategoryId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {cat.emoji} {cat.label}
        </h2>
        <p className="text-muted-foreground">{cat.audience}</p>
      </div>
      <MenuAdminPanel
        categoryId={category as MenuCategoryId}
        categoryLabel={cat.label}
        favorites={items.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description ?? "",
          votes: i.votes,
          emoji: i.emoji ?? "🍽️",
        }))}
        weekly={weekly.map((w) => ({
          id: w.id,
          dayLabel: w.dayLabel,
          menuText: w.menuText,
        }))}
      />
    </div>
  );
}
