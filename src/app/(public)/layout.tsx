import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getTrendingTopicsCached } from "@/lib/cached-queries";
import { safeQuery } from "@/lib/safe-db";

const FALLBACK_TOPICS = [
  "Menu Favorit Minggu Ini 🍽️",
  "Request Menu Porsi Kecil 🧒",
  "Tips Gizi Buat Ibu Hamil 🤰",
  "Yuk Isi Survey! ⭐",
];

export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trendingTopics = await safeQuery(
    () => getTrendingTopicsCached(),
    FALLBACK_TOPICS,
    "getTrendingTopics"
  );

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader trendingTopics={trendingTopics} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
