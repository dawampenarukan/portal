"use client";

import type { WeeklyMenuPublicItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MenuTodayCardProps {
  today: WeeklyMenuPublicItem | null;
  /** Soften ALL-CAPS inventory names for display. */
  displayName: (name: string) => string;
  /** Kategori aktif — ditampilkan di header agar jelas saat ganti tab. */
  categoryLabel?: string;
  className?: string;
}

export function MenuTodayCard({
  today,
  displayName,
  categoryLabel,
  className,
}: MenuTodayCardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-sm ring-2 ring-white/60 backdrop-blur-sm",
        className
      )}
      aria-labelledby="menu-hari-ini-title"
    >
      <div className="flex flex-col gap-0 md:flex-row">
        <div className="relative aspect-4/3 w-full shrink-0 bg-linear-to-br from-secondary/40 via-sunny/30 to-sky/30 md:aspect-auto md:w-[42%] md:min-h-55">
          {today?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={today.imageUrl}
              alt={displayName(today.menuText)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-45 items-center justify-center text-6xl md:min-h-55">
              {today?.emoji ?? "🍽️"}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2 p-5 md:p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Menu Hari Ini
            {categoryLabel ? (
              <span className="ml-2 font-semibold normal-case tracking-normal text-primary/70">
                · {categoryLabel}
              </span>
            ) : null}
          </p>
          <h3
            id="menu-hari-ini-title"
            className="text-xl font-extrabold leading-tight text-foreground md:text-2xl"
          >
            {today ? displayName(today.menuText) : "Belum ada menu untuk hari ini"}
          </h3>
          {today ? (
            <>
              <p className="text-sm font-medium text-primary/80">{today.heading}</p>
              {today.description ? (
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                  {today.description}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Jadwal dari Rencana Produksi. Deskripsi & foto bisa dilengkapi di admin.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sinkronkan jadwal dari Inventory atau tambah menu untuk tanggal hari ini di
              panel admin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
