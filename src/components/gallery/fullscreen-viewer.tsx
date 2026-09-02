"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { classifyGesture } from "@/lib/gesture";
import type { GalleryImage } from "@/features/gallery";

type FullscreenViewerProps = {
  imageId: string;
  images: GalleryImage[];
  onDismiss: () => void;
  onNavigate: (id: string) => void;
};

export function FullscreenViewer({ imageId, images, onDismiss, onNavigate }: FullscreenViewerProps) {
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const index = images.findIndex((image) => image.id === imageId);
  const image = images[index];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
      if (event.key === "ArrowLeft" && index > 0) onNavigate(images[index - 1].id);
      if (event.key === "ArrowRight" && index < images.length - 1) onNavigate(images[index + 1].id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [imageId, images, index, onDismiss, onNavigate]);

  if (!image) return null;

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!startPoint.current) return;
    const deltaX = event.clientX - startPoint.current.x;
    const deltaY = event.clientY - startPoint.current.y;
    const gesture = classifyGesture(deltaX, deltaY);
    startPoint.current = null;
    if (gesture === "dismiss") onDismiss();
    if (gesture === "previous" && index > 0) onNavigate(images[index - 1].id);
    if (gesture === "next" && index < images.length - 1) onNavigate(images[index + 1].id);
    if (gesture !== "none" || Math.abs(deltaX) > 12 || Math.abs(deltaY) > 12) return;
    if (event.target instanceof Element && event.target.closest("button")) return;

    const third = event.currentTarget.clientWidth / 3;
    if (event.clientX <= third && index > 0) onNavigate(images[index - 1].id);
    if (event.clientX >= third * 2 && index < images.length - 1) onNavigate(images[index + 1].id);
  };

  return (
    <div
      aria-label="Full screen image viewer"
      aria-modal="true"
      className="fixed inset-0 z-50 flex touch-none flex-col bg-slate-950 text-white"
      onPointerDown={(event) => { startPoint.current = { x: event.clientX, y: event.clientY }; }}
      onPointerUp={handlePointerUp}
      role="dialog"
    >
      <header className="relative z-20 flex min-h-14 items-center justify-between px-3 sm:px-5">
        <p className="truncate pr-3 text-xs text-slate-300">{image.originalUrl}</p>
        <IconButton label="Close full screen viewer" onClick={onDismiss} size="touch" tone="overlay"><X size={20} /></IconButton>
      </header>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
        {index > 0 && <IconButton className="absolute left-3 top-1/2 z-20 -translate-y-1/2" label="Previous image" onClick={() => onNavigate(images[index - 1].id)} size="touch" tone="overlay"><ChevronLeft size={24} /></IconButton>}
        {/* The gallery intentionally displays the saved source URL without an image proxy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={image.note || "Saved image"} className="max-h-full max-w-full select-none object-contain" draggable="false" src={image.originalUrl} />
        {index < images.length - 1 && <IconButton className="absolute right-3 top-1/2 z-20 -translate-y-1/2" label="Next image" onClick={() => onNavigate(images[index + 1].id)} size="touch" tone="overlay"><ChevronRight size={24} /></IconButton>}
      </div>
      {image.note && <p className="px-5 pb-5 text-sm text-slate-200">{image.note}</p>}
    </div>
  );
}
