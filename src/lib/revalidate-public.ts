import { revalidateTag } from "next/cache";
import {
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

export function revalidatePublicContent(scope?: {
  articles?: boolean;
  events?: boolean;
  publications?: boolean;
  survey?: boolean;
  menu?: boolean;
  organoleptic?: boolean;
}) {
  invalidateCacheTag(PUBLIC_DATA_TAG);

  if (!scope) {
    invalidateCacheTag(ARTICLES_TAG);
    invalidateCacheTag(EVENTS_TAG);
    invalidateCacheTag(PUBLICATIONS_TAG);
    invalidateCacheTag(SURVEY_TAG);
    invalidateCacheTag(MENU_DATA_TAG);
    return;
  }

  if (scope.articles) invalidateCacheTag(ARTICLES_TAG);
  if (scope.events) invalidateCacheTag(EVENTS_TAG);
  if (scope.publications) invalidateCacheTag(PUBLICATIONS_TAG);
  if (scope.survey) invalidateCacheTag(SURVEY_TAG);
  if (scope.menu) invalidateCacheTag(MENU_DATA_TAG);
  if (scope.organoleptic) invalidateCacheTag(ORGANOLEPTIC_TAG);
}
