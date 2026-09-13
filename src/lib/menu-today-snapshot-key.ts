import type { TodayMenuAdminSnapshot } from "@/lib/types";

/** Key stabil untuk remount form setelah sync / reset. Aman dipanggil di server. */
export function snapshotSyncKey(snapshot: TodayMenuAdminSnapshot): string {
  return [
    snapshot.todayYmd,
    snapshot.inventoryDefault?.menuText ?? "",
    ...snapshot.categories.map(
      (c) =>
        `${c.categoryId}:${c.entry?.id ?? ""}:${c.entry?.menuText ?? ""}:${c.entry?.description ?? ""}:${c.entry?.imageUrl ?? ""}`
    ),
  ].join("|");
}
