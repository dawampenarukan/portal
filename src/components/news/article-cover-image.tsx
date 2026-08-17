import Image from "next/image";
import { cn } from "@/lib/utils";

interface ArticleCoverImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackEmoji?: string;
  /**
   * Default true — parent harus `relative` + ukuran eksplisit
   * (aspect-*, h/w, absolute inset, dll.).
   */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

function mediaPath(src: string): string {
  try {
    return new URL(src, "http://local").pathname.toLowerCase();
  } catch {
    return src.toLowerCase();
  }
}

function isAnimatedGifUrl(src: string): boolean {
  return mediaPath(src).endsWith(".gif") || /\.gif($|\?)/i.test(src);
}

function isMp4CoverUrl(src: string): boolean {
  return mediaPath(src).endsWith(".mp4") || /\.mp4($|\?)/i.test(src);
}

export function ArticleCoverImage({
  src,
  alt,
  className,
  fallbackEmoji = "📰",
  fill = true,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: ArticleCoverImageProps) {
  if (src) {
    const fillClass = fill ? "absolute inset-0 h-full w-full" : "h-full w-full";

    if (isMp4CoverUrl(src)) {
      return (
        <video
          src={src}
          className={cn("object-cover", fillClass, className)}
          autoPlay
          muted
          loop
          playsInline
          preload={priority ? "auto" : "metadata"}
          aria-label={alt}
        />
      );
    }

    if (isAnimatedGifUrl(src)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- next/image membekukan GIF
        <img
          src={src}
          alt={alt}
          className={cn("object-cover", fillClass, className)}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      );
    }

    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-cover", className)}
          sizes={sizes}
          priority={priority}
        />
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={800}
        height={450}
        className={cn("h-full w-full object-cover", className)}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-linear-to-br from-secondary/60 via-accent to-sky/40 text-5xl",
        className
      )}
      aria-hidden
    >
      {fallbackEmoji}
    </div>
  );
}
