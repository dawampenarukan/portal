import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getTrendingTopicsCached } from "@/lib/cached-queries";
import { safeQuery } from "@/lib/safe-db";
import { FALLBACK_TRENDING_TOPICS, normalizeTrendingTopics } from "@/lib/trending-topics";

export const revalidate = 60;

export async function PublicShell({ children }: { children: React.ReactNode }) {
  const trendingTopics = normalizeTrendingTopics(
    await safeQuery(
      () => getTrendingTopicsCached(),
      FALLBACK_TRENDING_TOPICS,
      "getTrendingTopics"
    )
  );

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader trendingTopics={trendingTopics} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
