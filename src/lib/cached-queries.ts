import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getArticleBySlug,
  getPublishedArticlesForList,
  getTrendingTopics,
} from "@/lib/queries";

export const REVALIDATE_PUBLIC = 60;

export const getArticleBySlugCached = cache(getArticleBySlug);

export const getTrendingTopicsCached = unstable_cache(
  () => getTrendingTopics(),
  ["trending-topics"],
  { revalidate: REVALIDATE_PUBLIC }
);

export const getPublishedArticlesForListCached = unstable_cache(
  () => getPublishedArticlesForList(),
  ["published-articles-list"],
  { revalidate: REVALIDATE_PUBLIC }
);
