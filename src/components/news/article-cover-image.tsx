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
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/60 via-accent to-sky/40 text-5xl",
        className
      )}
      aria-hidden
    >
      {fallbackEmoji}
    </div>
  );
}
