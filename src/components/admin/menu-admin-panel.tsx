"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MENU_CATEGORY_ID_TO_TYPE, MenuCategoryId } from "@/lib/menu-meta";
import type { FavoriteMenuView } from "@/lib/types";

interface MenuAdminPanelProps {
  categoryId: MenuCategoryId;
  categoryLabel: string;
  favorites: FavoriteMenuView[];
  weekly: { id: string; dayLabel: string; menuText: string }[];
}

export function MenuAdminPanel({ categoryId, categoryLabel, favorites, weekly }: MenuAdminPanelProps) {
  const router = useRouter();
  const categoryType = MENU_CATEGORY_ID_TO_TYPE[categoryId];
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuEmoji, setNewMenuEmoji] = useState("🍽️");
  const [loading, setLoading] = useState(false);

  async function addMenuItem() {
    if (!newMenuName.trim()) return;
    setLoading(true);
    await fetch("/api/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newMenuName,
        emoji: newMenuEmoji,
        category: categoryType,
      }),
    });
    setNewMenuName("");
    setLoading(false);
    router.refresh();
  }

  async function deleteMenuItem(id: string) {
    if (!confirm("Hapus menu ini?")) return;
    await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function updateWeekly(id: string, menuText: string) {
    await fetch(`/api/weekly-menu/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuText }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold">Menu Favorit — {categoryLabel}</h3>
        <div className="mt-3 space-y-2">
          {favorites.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <span>
                {item.emoji} {item.name} ({item.votes} suara)
              </span>
              <Button size="sm" variant="ghost" onClick={() => deleteMenuItem(item.id)}>
                Hapus
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input placeholder="Nama menu" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} />
          <Input placeholder="Emoji" value={newMenuEmoji} onChange={(e) => setNewMenuEmoji(e.target.value)} className="w-20" />
          <Button onClick={addMenuItem} disabled={loading}>
            Tambah
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Jadwal Mingguan</h3>
        <div className="mt-3 space-y-2">
          {weekly.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 text-sm">
              <span className="w-20 font-medium">{entry.dayLabel}</span>
              <Input
                defaultValue={entry.menuText}
                onBlur={(e) => {
                  if (e.target.value !== entry.menuText) {
                    updateWeekly(entry.id, e.target.value);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
