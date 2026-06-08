import Image from "next/image";
import { cn } from "@/lib/utils";

interface ArticleCoverImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackEmoji?: string;
  fill?: boolean;
}

export function ArticleCoverImage({
  src,
  alt,
  className,
  fallbackEmoji = "📰",
  fill = false,
}: ArticleCoverImageProps) {
  if (src) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-cover", className)}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} />
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
