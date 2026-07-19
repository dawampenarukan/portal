import { Suspense } from "react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicHeaderServer } from "@/components/layout/public-header-server";
import {
  TrendingTopicsBar,
  TrendingTopicsBarSkeleton,
} from "@/components/layout/trending-topics-bar";

export const revalidate = 60;

function PublicHeaderFallback() {
  return <PublicHeader organolepticNotices={null} />;
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md">
        <Suspense fallback={<TrendingTopicsBarSkeleton />}>
          <TrendingTopicsBar />
        </Suspense>
        <Suspense fallback={<PublicHeaderFallback />}>
          <PublicHeaderServer />
        </Suspense>
      </header>
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
