"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ArticleDetailVideoProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Detail berita: coba autoplay langsung dengan suara.
 * Jika browser memblokir (kebijakan autoplay), fallback muted + controls
 * agar video tetap jalan dan pembaca bisa unmute.
 */
export function ArticleDetailVideo({
  src,
  alt,
  className,
}: ArticleDetailVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    let cancelled = false;

    async function tryPlayWithSound() {
      if (!video || cancelled) return;
      video.muted = false;
      video.volume = 1;
      try {
        await video.play();
      } catch {
        // Autoplay ber-suara diblokir — putar muted dulu, tetap ada controls.
        if (cancelled || !video) return;
        video.muted = true;
        try {
          await video.play();
        } catch {
          // Biarkan user tekan play manual via controls.
        }
      }
    }

    void tryPlayWithSound();

    // Setelah interaksi apa pun di halaman, coba nyalakan suara lagi.
    const unlock = () => {
      if (!video || cancelled) return;
      if (!video.muted) return;
      video.muted = false;
      video.volume = 1;
      void video.play().catch(() => {
        video.muted = true;
      });
    };

    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      className={cn("object-contain bg-black", className)}
      autoPlay
      loop
      playsInline
      controls
      preload="auto"
      aria-label={alt}
      title="Video diputar dengan suara bila diizinkan browser"
    />
  );
}
