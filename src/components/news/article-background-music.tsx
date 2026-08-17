"use client";

import { useMemo } from "react";
import { ExternalLink, Music2 } from "lucide-react";
import {
  buildYoutubeEmbedUrl,
  formatSecondsToTimestamp,
  parseYoutubeVideoId,
} from "@/lib/article-background-music";

export interface ArticleBackgroundMusicProps {
  url: string;
  title?: string | null;
  credit?: string | null;
  startSec?: number | null;
  endSec?: number | null;
}

export function ArticleBackgroundMusic({
  url,
  title,
  credit,
  startSec,
  endSec,
}: ArticleBackgroundMusicProps) {
  const videoId = useMemo(() => parseYoutubeVideoId(url), [url]);

  const clipLabel = useMemo(() => {
    const from = formatSecondsToTimestamp(startSec);
    const to = formatSecondsToTimestamp(endSec);
    if (from && to) return `Cuplikan ${from}–${to}`;
    if (from) return `Mulai ${from}`;
    if (to) return `Sampai ${to}`;
    return null;
  }, [startSec, endSec]);

  const embedSrc = videoId
    ? buildYoutubeEmbedUrl(videoId, {
        startSec,
        endSec,
        autoplay: true,
      })
    : null;

  const displayTitle = title?.trim() || "Musik latar";
  const displayCredit = credit?.trim() || "Sumber eksternal";

  return (
    <section
      className="mb-6 space-y-3 rounded-2xl border bg-white/80 p-4 shadow-sm"
      aria-label="Musik dan rujukan"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Music2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate">{displayTitle}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sumber:{" "}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {displayCredit}
            </a>
            {clipLabel ? ` · ${clipLabel}` : ""}
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Buka di sumber
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>

      {embedSrc ? (
        <div className="space-y-2">
          <div className="aspect-video overflow-hidden rounded-xl border bg-black">
            <iframe
              src={embedSrc}
              title={displayTitle}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Jika tidak otomatis berbunyi, klik play di player YouTube (kebijakan
            browser). Selalu hormati hak cipta — putar lewat sumber resmi.
          </p>
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          <ExternalLink className="mr-1 h-4 w-4" />
          Dengarkan di sumber
        </a>
      )}
    </section>
  );
}
