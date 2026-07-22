"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  sidebar: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AdminShell({
  sidebar,
  title,
  subtitle,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const navId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isMobile]);

  const drawerClosedOnMobile = isMobile && !open;

  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    if (drawerClosedOnMobile) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }, [drawerClosedOnMobile]);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {open && isMobile ? (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        ref={drawerRef}
        id={navId}
        role={isMobile && open ? "dialog" : undefined}
        aria-modal={isMobile && open ? true : undefined}
        aria-label={isMobile ? "Navigasi admin" : undefined}
        aria-hidden={drawerClosedOnMobile ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-primary transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          drawerClosedOnMobile && "pointer-events-none"
        )}
      >
        <div className="flex shrink-0 items-center justify-end border-b border-white/10 px-2 py-2 lg:hidden">
          <button
            type="button"
            aria-label="Tutup navigasi"
            onClick={() => setOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {sidebar}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-start gap-3 border-b bg-white px-4 py-4 sm:px-6">
          <button
            type="button"
            aria-label="Buka menu navigasi"
            aria-expanded={open}
            aria-controls={navId}
            onClick={() => setOpen(true)}
            className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{subtitle}</p>
            <h1 className="truncate text-lg font-semibold">{title}</h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
