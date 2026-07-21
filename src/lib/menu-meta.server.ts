import "server-only";

import { MenuCategoryType } from "@prisma/client";
import {
  MENU_CATEGORY_ID_TO_TYPE,
  type MenuCategoryId,
  type MenuCategoryTypeId,
} from "@/lib/menu-meta";

/** Konversi ID kategori → enum Prisma (server-only). */
export function toMenuCategoryType(id: MenuCategoryId): MenuCategoryType {
  return MENU_CATEGORY_ID_TO_TYPE[id] as MenuCategoryType;
}

/** Cast string tipe kategori (dari API/client) → enum Prisma. */
export function toMenuCategoryTypeValue(
  type: MenuCategoryTypeId | MenuCategoryType | string
): MenuCategoryType {
  return type as MenuCategoryType;
}
