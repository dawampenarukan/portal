import { Suspense } from "react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import {
  TrendingTopicsBar,
  TrendingTopicsBarSkeleton,
} from "@/components/layout/trending-topics-bar";

export const revalidate = 60;

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md">
        <Suspense fallback={<TrendingTopicsBarSkeleton />}>
          <TrendingTopicsBar />
        </Suspense>
        <PublicHeader />
      </header>
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
