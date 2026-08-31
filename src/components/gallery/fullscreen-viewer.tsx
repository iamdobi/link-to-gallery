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
    const gesture = classifyGesture(event.clientX - startPoint.current.x, event.clientY - startPoint.current.y);
    startPoint.current = null;
    if (gesture === "dismiss") onDismiss();
    if (gesture === "previous" && index > 0) onNavigate(images[index - 1].id);
    if (gesture === "next" && index < images.length - 1) onNavigate(images[index + 1].id);
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
      <header className="flex min-h-14 items-center justify-between px-3 sm:px-5">
        <p className="truncate pr-3 text-xs text-slate-300">{image.originalUrl}</p>
        <IconButton className="border-slate-600 bg-slate-900 text-white hover:border-slate-400 hover:bg-slate-800" label="Close full screen viewer" onClick={onDismiss}><X size={20} /></IconButton>
      </header>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
        {index > 0 && <IconButton className="absolute left-3 z-10 border-slate-600 bg-slate-900/85 text-white hover:border-slate-400 hover:bg-slate-800" label="Previous image" onClick={() => onNavigate(images[index - 1].id)}><ChevronLeft size={22} /></IconButton>}
        {/* The gallery intentionally displays the saved source URL without an image proxy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={image.note || "Saved image"} className="max-h-full max-w-full select-none object-contain" draggable="false" src={image.originalUrl} />
        {index < images.length - 1 && <IconButton className="absolute right-3 z-10 border-slate-600 bg-slate-900/85 text-white hover:border-slate-400 hover:bg-slate-800" label="Next image" onClick={() => onNavigate(images[index + 1].id)}><ChevronRight size={22} /></IconButton>}
      </div>
      {image.note && <p className="px-5 pb-5 text-sm text-slate-200">{image.note}</p>}
    </div>
  );
}
