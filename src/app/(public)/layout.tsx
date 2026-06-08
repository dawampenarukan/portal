import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getTrendingTopics } from "@/lib/queries";
import { safeQuery } from "@/lib/safe-db";

const FALLBACK_TOPICS = [
  "Menu Favorit Minggu Ini 🍽️",
  "Request Menu Porsi Kecil 🧒",
  "Tips Gizi Buat Ibu Hamil 🤰",
  "Yuk Isi Survey! ⭐",
];

// Render at request time — avoids DB connection during Vercel build
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trendingTopics = await safeQuery(
    () => getTrendingTopics(),
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
