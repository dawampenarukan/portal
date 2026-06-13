import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getArticleBySlug,
  getMenuDataByCategory,
  getMenuPreviewTopItems,
  getPerformancePublications,
  getPublishedArticlesForList,
  getPublishedEvents,
  getPublishedPublications,
  getSurveyData,
  getSurveyPublications,
  getTrendingTopics,
  getActiveSurveySummaries,
} from "@/lib/queries";
import type { MenuCategoryId } from "@/lib/menu-meta";
import { getOrganolepticPublicDisplay } from "@/lib/organoleptic-queries";

export const REVALIDATE_PUBLIC = 60;
export const REVALIDATE_MENU = 30;

export const PUBLIC_DATA_TAG = "public-data";
export const MENU_DATA_TAG = "menu-data";
export const ARTICLES_TAG = "articles";
export const EVENTS_TAG = "events";
export const PUBLICATIONS_TAG = "publications";
export const SURVEY_TAG = "survey";
export const ORGANOLEPTIC_TAG = "organoleptic";

export const getArticleBySlugCached = cache(getArticleBySlug);

export const getTrendingTopicsCached = unstable_cache(
  () => getTrendingTopics(),
  ["trending-topics-v2"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, ARTICLES_TAG] }
);

export const getPublishedArticlesForListCached = unstable_cache(
  () => getPublishedArticlesForList(),
  ["published-articles-list"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, ARTICLES_TAG] }
);

export const getPublishedEventsCached = unstable_cache(
  () => getPublishedEvents(),
  ["published-events"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, EVENTS_TAG] }
);

export const getPublishedPublicationsCached = unstable_cache(
  () => getPublishedPublications(),
  ["published-publications"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, PUBLICATIONS_TAG] }
);

export const getSurveyDataCached = unstable_cache(
  () => getSurveyData(),
  ["survey-data-v2"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, SURVEY_TAG, PUBLICATIONS_TAG] }
);

export const getActiveSurveySummariesCached = unstable_cache(
  () => getActiveSurveySummaries(),
  ["active-survey-summaries"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, SURVEY_TAG] }
);

export const getSurveyPublicationsCached = unstable_cache(
  () => getSurveyPublications(),
  ["survey-publications-v2"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, PUBLICATIONS_TAG, SURVEY_TAG] }
);

export const getPerformancePublicationsCached = unstable_cache(
  () => getPerformancePublications(),
  ["performance-publications"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, PUBLICATIONS_TAG] }
);

export const getMenuPreviewTopItemsCached = unstable_cache(
  () => getMenuPreviewTopItems(),
  ["menu-preview-top"],
  { revalidate: REVALIDATE_MENU, tags: [MENU_DATA_TAG] }
);

export async function getMenuDataByCategoryCached(categoryId: MenuCategoryId) {
  return unstable_cache(
    () => getMenuDataByCategory(categoryId),
    ["menu-data", categoryId],
    { revalidate: REVALIDATE_MENU, tags: [MENU_DATA_TAG, `${MENU_DATA_TAG}-${categoryId}`] }
  )();
}

export const getOrganolepticPublicDisplayCached = unstable_cache(
  () => getOrganolepticPublicDisplay(),
  ["organoleptic-public-v1"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, ORGANOLEPTIC_TAG, MENU_DATA_TAG] }
);
