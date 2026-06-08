import { revalidateTag } from "next/cache";
import {
  ARTICLES_TAG,
  EVENTS_TAG,
  MENU_DATA_TAG,
  PUBLIC_DATA_TAG,
  PUBLICATIONS_TAG,
  SURVEY_TAG,
} from "@/lib/cached-queries";

export function revalidatePublicContent(scope?: {
  articles?: boolean;
  events?: boolean;
  publications?: boolean;
  survey?: boolean;
  menu?: boolean;
}) {
  revalidateTag(PUBLIC_DATA_TAG);

  if (!scope) {
    revalidateTag(ARTICLES_TAG);
    revalidateTag(EVENTS_TAG);
    revalidateTag(PUBLICATIONS_TAG);
    revalidateTag(SURVEY_TAG);
    revalidateTag(MENU_DATA_TAG);
    return;
  }

  if (scope.articles) revalidateTag(ARTICLES_TAG);
  if (scope.events) revalidateTag(EVENTS_TAG);
  if (scope.publications) revalidateTag(PUBLICATIONS_TAG);
  if (scope.survey) revalidateTag(SURVEY_TAG);
  if (scope.menu) revalidateTag(MENU_DATA_TAG);
}
