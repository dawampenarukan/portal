"use client";

import { cn } from "@/lib/utils";
import { DEFAULT_MENU_ICON, MENU_FOOD_ICONS } from "@/lib/menu-icons";

interface MenuIconPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function MenuIconPicker({ value, onChange }: MenuIconPickerProps) {
  const selected = value || DEFAULT_MENU_ICON;

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">Ikon Menu</label>
      <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background p-2">
        {MENU_FOOD_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-xl transition-all hover:bg-accent",
              selected === icon && "bg-primary/15 ring-2 ring-primary ring-offset-1"
            )}
            aria-label={`Pilih ikon ${icon}`}
            aria-pressed={selected === icon}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
