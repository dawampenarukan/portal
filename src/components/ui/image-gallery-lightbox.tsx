"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  src: string;
  alt: string;
}

interface ImageGalleryLightboxProps {
  images: GalleryImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startIndex?: number;
}

const SWIPE_THRESHOLD_PX = 48;

export function ImageGalleryLightbox({
  images,
  open,
  onOpenChange,
  startIndex = 0,
}: ImageGalleryLightboxProps) {
  const titleId = useId();
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(images.length - 1, i + 1));
      }
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, images.length, onOpenChange]);

  if (!open || images.length === 0 || !mounted) return null;

  const current = images[index] ?? images[0];
  const hasMultiple = images.length > 1;

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(images.length - 1, i + 1));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null || !hasMultiple) return;
    const endX = e.changedTouches[0]?.clientX;
    if (endX == null) return;

    const delta = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta > 0) goPrev();
    else goNext();
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <p id={titleId} className="sr-only">
        Galeri gambar — {current.alt}
      </p>

      <button
        type="button"
        onClick={() => onOpenChange(false)}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
        aria-label="Tutup galeri"
      >
        <X className="h-5 w-5" />
      </button>

      {hasMultiple ? (
        <p className="absolute left-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
          {index + 1} / {images.length}
        </p>
      ) : null}

      <div
        className="relative mx-auto flex w-full max-w-5xl items-center justify-center px-10 sm:px-14"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {hasMultiple ? (
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="absolute left-0 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Gambar sebelumnya"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.alt}
          className="max-h-[min(78vh,900px)] max-w-full rounded-lg object-contain shadow-2xl"
          draggable={false}
        />

        {hasMultiple ? (
          <button
            type="button"
            onClick={goNext}
            disabled={index === images.length - 1}
            className="absolute right-0 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Gambar berikutnya"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        ) : null}
      </div>

      {hasMultiple ? (
        <div
          className="mt-4 flex max-w-5xl gap-2 overflow-x-auto pb-1"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((image, thumbIndex) => (
            <button
              key={`${image.src}-${thumbIndex}`}
              type="button"
              onClick={() => setIndex(thumbIndex)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                thumbIndex === index
                  ? "border-white ring-2 ring-white/40"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
              aria-label={`Lihat gambar ${thumbIndex + 1}`}
              aria-current={thumbIndex === index}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {hasMultiple ? (
        <p className="mt-3 text-center text-xs text-white/70">
          Geser kiri/kanan atau gunakan panah untuk berpindah gambar
        </p>
      ) : null}
    </div>,
    document.body
  );
}
