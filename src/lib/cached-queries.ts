import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getArticleBySlug,
  getDashboardStats,
  getHomeArticlesPayload,
  getMenuDataByCategory,
  getMenuPreviewTopItems,
  getNewFeedbackCount,
  getPerformancePublications,
  getPublishedArticlesForList,
  getPopularPublishedArticlesForList,
  getPublishedEvents,
  getPublishedPublications,
  getSurveyData,
  getSurveyPublications,
  getTrendingTopics,
  getActiveSurveySummaries,
  PUBLISHED_ARTICLES_LIST_TAKE,
} from "@/lib/queries";
import type { MenuCategoryId } from "@/lib/menu-meta";
import {
  getOrganolepticAdminNotices,
  getOrganolepticPublicDisplay,
} from "@/lib/organoleptic-queries";
import { EMPTY_SURVEY_DATA, safeQuery } from "@/lib/safe-db";
import type { ArticleView } from "@/lib/types";

export const REVALIDATE_PUBLIC = 60;
export const REVALIDATE_MENU = 30;

export const PUBLIC_DATA_TAG = "public-data";
export const MENU_DATA_TAG = "menu-data";
export const ARTICLES_TAG = "articles";
export const EVENTS_TAG = "events";
export const PUBLICATIONS_TAG = "publications";
export const SURVEY_TAG = "survey";
export const ORGANOLEPTIC_TAG = "organoleptic";
export const ADMIN_FEEDBACK_TAG = "admin-feedback";
export const ADMIN_STATS_TAG = "admin-stats";

export function getArticleBySlugCached(slug: string) {
  return unstable_cache(
    () => getArticleBySlug(slug),
    ["article-slug", slug],
    { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, ARTICLES_TAG, `article-${slug}`] }
  )();
}

const getDashboardStatsUnstable = unstable_cache(
  () => getDashboardStats(),
  ["dashboard-stats"],
  { revalidate: 30, tags: [ADMIN_STATS_TAG, ADMIN_FEEDBACK_TAG] }
);

export const getDashboardStatsCached = cache(() => getDashboardStatsUnstable());

export const getNewFeedbackCountCached = unstable_cache(
  () => getNewFeedbackCount(),
  ["new-feedback-count"],
  { revalidate: 30, tags: [ADMIN_FEEDBACK_TAG] }
);

export const getTrendingTopicsCached = unstable_cache(
  () => getTrendingTopics(),
  ["trending-topics-v2"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, ARTICLES_TAG] }
);

export async function getPublishedArticlesForListCached(
  take: number = PUBLISHED_ARTICLES_LIST_TAKE
) {
  return unstable_cache(
    () => getPublishedArticlesForList(take),
    ["published-articles-list", String(take)],
    { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, ARTICLES_TAG] }
  )();
}

export async function getPopularPublishedArticlesForListCached(take = 8) {
  return unstable_cache(
    () => getPopularPublishedArticlesForList(take),
    ["popular-published-articles-list", String(take)],
    { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, ARTICLES_TAG] }
  )();
}

const emptyHomeArticles = {
  hero: null as ArticleView | null,
  highlights: [] as ArticleView[],
  popular: [] as ArticleView[],
  latest: [] as ArticleView[],
};

const getHomeArticlesPayloadUnstable = unstable_cache(
  () => getHomeArticlesPayload(),
  ["home-articles-payload-v1"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, ARTICLES_TAG] }
);

/** Dedup dalam satu request homepage (hero + highlights + latest). */
export const getHomeArticlesPayloadCached = cache(() =>
  safeQuery(
    () => getHomeArticlesPayloadUnstable(),
    emptyHomeArticles,
    "getHomeArticlesPayload"
  )
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
  () => safeQuery(() => getSurveyData(), EMPTY_SURVEY_DATA, "getSurveyData"),
  ["survey-data-v2"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, SURVEY_TAG, PUBLICATIONS_TAG] }
);

/** Homepage: hanya chartData tersimpan — tanpa aggregate responses live. */
export const getHomeSurveyDataCached = unstable_cache(
  () =>
    safeQuery(
      () => getSurveyData({ allowLiveAggregate: false }),
      EMPTY_SURVEY_DATA,
      "getHomeSurveyData"
    ),
  ["home-survey-chart-only-v1"],
  { revalidate: REVALIDATE_PUBLIC, tags: [PUBLIC_DATA_TAG, SURVEY_TAG, PUBLICATIONS_TAG] }
);

export const getActiveSurveySummariesCached = unstable_cache(
  () => safeQuery(() => getActiveSurveySummaries(), [], "getActiveSurveySummaries"),
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
  ["menu-preview-top-v2"],
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

/** Badge nav admin — TTL pendek; di-bust via ORGANOLEPTIC_TAG saat create/evaluate/delete. */
export const getOrganolepticAdminNoticesCached = unstable_cache(
  () => getOrganolepticAdminNotices(),
  ["organoleptic-admin-notices"],
  { revalidate: 15, tags: [ORGANOLEPTIC_TAG] }
);
