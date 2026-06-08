export const MENU_FOOD_ICONS = [
  "🍽️",
  "🍚",
  "🍛",
  "🍜",
  "🍲",
  "🥘",
  "🍳",
  "🥗",
  "🍗",
  "🍖",
  "🥩",
  "🐟",
  "🦐",
  "🍤",
  "🥚",
  "🌽",
  "🍞",
  "🥖",
  "🧀",
  "🥛",
  "🍎",
  "🍌",
  "🥦",
  "🥕",
  "🍝",
  "🍢",
  "🥟",
  "🫕",
  "🧆",
  "🥙",
  "🌯",
  "🍱",
] as const;

export type MenuFoodIcon = (typeof MENU_FOOD_ICONS)[number];

export const DEFAULT_MENU_ICON: MenuFoodIcon = "🍽️";

export function normalizeMenuIcon(value?: string | null): MenuFoodIcon {
  if (value && MENU_FOOD_ICONS.includes(value as MenuFoodIcon)) {
    return value as MenuFoodIcon;
  }
  return DEFAULT_MENU_ICON;
}
