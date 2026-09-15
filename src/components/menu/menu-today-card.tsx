"use client";

import type { WeeklyMenuPublicItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Jam konsumsi + selesai masak — dua tahap operasional MBG. */
const CONSUMPTION_STAGES = [
  {
    tahap: "Tahap I",
    consumePrefix: "Konsumsi sebelum",
    consumeTime: "10.00 WIB",
    cookedLabel: "Siap jam",
    cookedAt: "04.00 WIB",
    tone: "bg-amber-50 text-amber-950 ring-amber-400",
    badge: "bg-amber-500 text-white",
  },
  {
    tahap: "Tahap II",
    consumePrefix: "Konsumsi sebelum",
    consumeTime: "12.00 WIB",
    cookedLabel: "Siap jam",
    cookedAt: "06.00 WIB",
    tone: "bg-sky-50 text-sky-950 ring-sky-400",
    badge: "bg-sky-600 text-white",
  },
] as const;

function ConsumptionStagesBanner() {
  return (
    <div
      className="border-b border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50/80 to-sky-50 p-1.5"
      role="region"
      aria-label="Jam konsumsi dan selesai memasak makanan MBG"
    >
      <div className="grid grid-cols-2 gap-1.5">
        {CONSUMPTION_STAGES.map((stage) => (
          <div
            key={stage.tahap}
            className={cn(
              "flex min-w-0 items-stretch gap-2 rounded-lg py-1.5 pl-1.5 pr-2 ring-1",
              stage.tone
            )}
          >
            <span
              className={cn(
                "inline-flex w-16 shrink-0 items-center justify-center self-stretch rounded-md px-1.5 text-center text-[10px] font-extrabold uppercase leading-tight tracking-wide",
                stage.badge
              )}
            >
              {stage.tahap}
            </span>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 pr-1">
              <p className="text-[10px] font-medium leading-snug text-foreground/55">
                {stage.cookedLabel}{" "}
                <span className="whitespace-nowrap">{stage.cookedAt}</span>
              </p>
              <p className="whitespace-nowrap text-[11px] font-semibold leading-none text-foreground">
                {stage.consumePrefix}
              </p>
            </div>
            <span className="consume-deadline-flash inline-flex min-w-[5.75rem] shrink-0 items-center justify-center self-center whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-black leading-none tracking-tight sm:min-w-[6.5rem] sm:px-3 sm:text-base md:text-lg">
              {stage.consumeTime}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuTodayDescription({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <div className="mt-1 space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className="whitespace-pre-line text-sm leading-relaxed text-foreground/80"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

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
      <div className="flex flex-col md:flex-row md:items-start">
        <figure className="flex w-full shrink-0 flex-col overflow-hidden md:w-1/2">
          <ConsumptionStagesBanner />
          {today?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={today.imageUrl}
              alt={displayName(today.menuText)}
              className="block h-auto w-full"
            />
          ) : (
            <div className="flex min-h-45 items-center justify-center bg-linear-to-br from-secondary/40 via-sunny/30 to-sky/30 text-6xl">
              {today?.emoji ?? "🍽️"}
            </div>
          )}
        </figure>

        <div className="flex w-full flex-col justify-center gap-2 p-5 md:w-1/2 md:p-7">
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
                <MenuTodayDescription text={today.description} />
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
