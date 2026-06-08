import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getTrendingTopics } from "@/lib/queries";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trendingTopics = await getTrendingTopics();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader trendingTopics={trendingTopics} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
