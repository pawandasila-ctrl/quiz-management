"use client";

import React, { useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  containerClassName?: string;
  imageClassName?: string;
  thumbHeight?: string;
}

export default function ImageLightbox({
  src,
  alt = "Image",
  containerClassName = "mt-3 rounded-lg overflow-hidden border border-border w-full relative bg-muted",
  imageClassName = "object-contain",
  thumbHeight = "h-48",
}: ImageLightboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  return (
    <>
      {/* Thumbnail — clickable */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Click to enlarge image"
        onClick={handleOpen}
        onKeyDown={(e) => e.key === "Enter" && handleOpen()}
        className={`${containerClassName} ${thumbHeight} cursor-zoom-in group relative`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className={imageClassName}
          sizes="(max-width: 768px) 100vw, 600px"
          quality={90}
        />
        {/* Hover zoom hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg">
          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
        </div>
      </div>

      {/* Lightbox overlay — fullscreen, maximum quality */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            aria-label="Close image"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Full-size image: use explicit large dimensions so Next.js serves full resolution */}
          <div
            className="relative max-w-5xl max-h-[90vh] w-full h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              fill
              quality={100}
              className="object-contain rounded-lg shadow-2xl"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
