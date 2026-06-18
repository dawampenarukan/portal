import Link from "next/link";
import { getTrendingTopicsCached } from "@/lib/cached-queries";
import { safeQuery } from "@/lib/safe-db";
import { FALLBACK_TRENDING_TOPICS, normalizeTrendingTopics } from "@/lib/trending-topics";

export function TrendingTopicsBarSkeleton() {
  return (
    <div className="bg-gradient-to-r from-primary via-[#3cb88a] to-sky">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5">
        <div className="h-6 w-24 shrink-0 animate-pulse rounded-full bg-white/20" />
        <div className="h-6 w-28 shrink-0 animate-pulse rounded-full bg-white/15" />
        <div className="h-6 w-32 shrink-0 animate-pulse rounded-full bg-white/15" />
      </div>
    </div>
  );
}

export async function TrendingTopicsBar() {
  const topics = normalizeTrendingTopics(
    await safeQuery(
      () => getTrendingTopicsCached(),
      FALLBACK_TRENDING_TOPICS,
      "getTrendingTopics"
    )
  );

  return (
    <div className="bg-gradient-to-r from-primary via-[#3cb88a] to-sky">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 text-xs md:text-sm">
        <span className="shrink-0 rounded-full bg-white/25 px-2.5 py-0.5 font-bold text-white">
          ✨ Lagi ramai
        </span>
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={topic.href}
            prefetch={true}
            className="shrink-0 rounded-full bg-white/20 px-3 py-1 font-medium text-white transition hover:bg-white/35"
          >
            {topic.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
