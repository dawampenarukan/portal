import { cn } from "@/lib/utils";

export type AtmPageTheme =
  | "home"
  | "menu"
  | "berita"
  | "event"
  | "kinerja"
  | "masukan"
  | "survey"
  | "article";

const EMOJI_BADGE: Record<AtmPageTheme, string> = {
  home: "from-coral/45 via-sunny/50 to-sky/40",
  menu: "from-sunny/50 via-secondary/40 to-sky/35",
  berita: "from-sky/50 via-lavender/40 to-primary/30",
  event: "from-sunny/55 via-coral/40 to-secondary/45",
  kinerja: "from-primary/35 via-sky/45 to-emerald-400/30",
  masukan: "from-lavender/45 via-secondary/50 to-sunny/40",
  survey: "from-sunny/50 via-primary/30 to-sky/40",
  article: "from-sky/45 via-primary/25 to-lavender/35",
};

interface AtmPageShellProps {
  theme: AtmPageTheme;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function AtmPageShell({
  theme,
  children,
  className,
  innerClassName,
}: AtmPageShellProps) {
  return (
    <div className={cn("atm-page-shell md:p-6", className)} data-theme={theme}>
      <div aria-hidden className="atm-page-blob atm-page-blob-a" />
      <div aria-hidden className="atm-page-blob atm-page-blob-b" />
      <div className={cn("atm-page-inner", innerClassName)}>{children}</div>
    </div>
  );
}

interface AtmPageHeaderProps {
  theme: AtmPageTheme;
  emoji: string;
  title: string;
  description?: string;
  className?: string;
  centered?: boolean;
}

export function AtmPageHeader({
  theme,
  emoji,
  title,
  description,
  className,
  centered = true,
}: AtmPageHeaderProps) {
  return (
    <div className={cn(centered ? "mb-8 text-center" : "mb-6", className)}>
      <span
        className={cn(
          "inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br text-5xl shadow-lg ring-4 ring-white/70",
          EMOJI_BADGE[theme]
        )}
      >
        {emoji}
      </span>
      <h1
        className={cn(
          "atm-page-title mt-4 text-2xl font-extrabold md:text-3xl",
          centered && "mt-4"
        )}
        data-theme={theme}
      >
        {title}
      </h1>
      {description && (
        <p
          className={cn(
            "mt-2 max-w-2xl text-muted-foreground",
            centered && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

interface AtmPagePanelProps {
  variant?: "main" | "sidebar" | "glass";
  children: React.ReactNode;
  className?: string;
}

export function AtmPagePanel({
  variant = "glass",
  children,
  className,
}: AtmPagePanelProps) {
  return (
    <div
      className={cn(
        variant === "main" && "atm-panel-main",
        variant === "sidebar" && "atm-panel-sidebar",
        variant === "glass" && "atm-panel-glass",
        className
      )}
    >
      {children}
    </div>
  );
}
