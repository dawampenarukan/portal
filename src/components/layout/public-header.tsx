"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS, SITE_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PublicHeaderProps {
  trendingTopics: string[];
}

export function PublicHeader({ trendingTopics }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/90 backdrop-blur-md">
      <div className="bg-gradient-to-r from-primary via-[#3cb88a] to-sky">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2.5 text-xs md:text-sm">
          <span className="shrink-0 rounded-full bg-white/25 px-2.5 py-0.5 font-bold text-white">
            ✨ Lagi ramai
          </span>
          {trendingTopics.map((topic) => (
            <Link
              key={topic}
              href="/berita"
              className="shrink-0 rounded-full bg-white/20 px-3 py-1 font-medium text-white transition hover:bg-white/35"
            >
              {topic}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo size="md" priority />
          <p className="hidden max-w-[140px] text-xs font-medium leading-snug text-muted-foreground md:block">
            {SITE_TAGLINE}
          </p>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all",
                pathname === item.href
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-foreground/80 hover:bg-accent hover:text-primary"
              )}
            >
              <span className="text-base" aria-hidden>
                {item.emoji}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            prefetch={false}
            className="hidden rounded-full bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-secondary-foreground md:inline-flex"
          >
            Admin
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold",
                  pathname === item.href
                    ? "bg-primary text-white"
                    : "hover:bg-accent"
                )}
              >
                <span>{item.emoji}</span>
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              prefetch={false}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-accent"
            >
              <span>🔐</span>
              Admin
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
