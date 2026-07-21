import { revalidateTag } from "next/cache";
import {
  ADMIN_FEEDBACK_TAG,
  ADMIN_STATS_TAG,
  ARTICLES_TAG,
  EVENTS_TAG,
  MENU_DATA_TAG,
  ORGANOLEPTIC_TAG,
  PUBLIC_DATA_TAG,
  PUBLICATIONS_TAG,
  SURVEY_TAG,
} from "@/lib/cached-queries";

function invalidateCacheTag(tag: string) {
  revalidateTag(tag, "max");
}

/**
 * Invalidate public Data Cache tags.
 * - Tanpa `scope`: nuke semua domain (ops admin / rare).
 * - Dengan `scope`: hanya tag domain terkait — jangan always-bust
 *   `PUBLIC_DATA_TAG` (itu yang membuat warm cache homepage collapse
 *   setelah write menu/organoleptik).
 */
export function revalidatePublicContent(scope?: {
  articles?: boolean;
  events?: boolean;
  publications?: boolean;
  survey?: boolean;
  menu?: boolean;
  organoleptic?: boolean;
}) {
  if (!scope) {
    invalidateCacheTag(PUBLIC_DATA_TAG);
    invalidateCacheTag(ARTICLES_TAG);
    invalidateCacheTag(EVENTS_TAG);
    invalidateCacheTag(PUBLICATIONS_TAG);
    invalidateCacheTag(SURVEY_TAG);
    invalidateCacheTag(MENU_DATA_TAG);
    invalidateCacheTag(ORGANOLEPTIC_TAG);
    invalidateCacheTag(ADMIN_STATS_TAG);
    return;
  }

  if (scope.articles) {
    invalidateCacheTag(ARTICLES_TAG);
    invalidateCacheTag(ADMIN_STATS_TAG);
  }
  if (scope.events) invalidateCacheTag(EVENTS_TAG);
  if (scope.publications) {
    invalidateCacheTag(PUBLICATIONS_TAG);
    invalidateCacheTag(ADMIN_STATS_TAG);
  }
  if (scope.survey) {
    invalidateCacheTag(SURVEY_TAG);
    invalidateCacheTag(ADMIN_STATS_TAG);
  }
  if (scope.menu) invalidateCacheTag(MENU_DATA_TAG);
  if (scope.organoleptic) invalidateCacheTag(ORGANOLEPTIC_TAG);
}

export function revalidateAdminFeedback() {
  invalidateCacheTag(ADMIN_FEEDBACK_TAG);
  invalidateCacheTag(ADMIN_STATS_TAG);
}

/** Dashboard counts (artikel, komentar pending, responden, masukan). */
export function revalidateAdminStats() {
  invalidateCacheTag(ADMIN_STATS_TAG);
}
