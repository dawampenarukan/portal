"use client";

import { useMemo, useState } from "react";
import { ArticleCoverImage } from "@/components/news/article-cover-image";
import { ImageGalleryLightbox } from "@/components/ui/image-gallery-lightbox";
import { collectArticleImages } from "@/lib/article-images";
import { cn } from "@/lib/utils";

interface ArticleDetailCoverProps {
  coverImage: string | null | undefined;
  title: string;
  content: string;
}

function isMp4Url(src: string): boolean {
  try {
    const path = new URL(src, "http://local").pathname.toLowerCase();
    return path.endsWith(".mp4");
  } catch {
    return /\.mp4($|\?)/i.test(src);
  }
}

export function ArticleDetailCover({
  coverImage,
  title,
  content,
}: ArticleDetailCoverProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);

  const imageUrls = useMemo(
    () => collectArticleImages(coverImage, content),
    [coverImage, content]
  );

  const galleryImages = useMemo(
    () =>
      imageUrls.map((src, index) => ({
        src,
        alt:
          imageUrls.length > 1
            ? `${title} — gambar ${index + 1}`
            : title,
      })),
    [imageUrls, title]
  );

  const isVideoCover = Boolean(coverImage && isMp4Url(coverImage));
  // Galeri hanya untuk gambar; cover video tidak dibuka sebagai lightbox gambar
  const canOpenGallery = !isVideoCover && galleryImages.length > 0;

  const coverClassName =
    "relative my-6 aspect-video overflow-hidden rounded-xl ring-2 ring-white/60";

  if (!canOpenGallery) {
    return (
      <div className={coverClassName}>
        <ArticleCoverImage
          src={coverImage}
          alt={title}
          fill
          priority
          fallbackEmoji="📰"
          sizes="(max-width: 768px) 100vw, 720px"
          videoMode={isVideoCover ? "detail" : "decorative"}
        />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setGalleryOpen(true)}
        className={cn(
          coverClassName,
          "group w-full cursor-zoom-in text-left outline-none transition",
          "hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={
          galleryImages.length > 1
            ? `Lihat ${galleryImages.length} gambar`
            : "Perbesar gambar"
        }
        title="Klik untuk melihat gambar"
      >
        <ArticleCoverImage
          src={coverImage}
          alt={title}
          fill
          priority
          fallbackEmoji="📰"
          sizes="(max-width: 768px) 100vw, 720px"
          className={cn(
            "transition duration-300 ease-out",
            !isVideoCover && "group-hover:scale-[1.02]"
          )}
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-3 py-2 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
          {galleryImages.length > 1
            ? `Lihat semua gambar (${galleryImages.length})`
            : "Klik untuk memperbesar"}
        </span>
      </button>

      <ImageGalleryLightbox
        images={galleryImages}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />
    </>
  );
}
