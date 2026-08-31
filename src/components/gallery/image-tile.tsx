"use client";

import { useState } from "react";
import { Folder, Tag } from "lucide-react";
import { BrokenImage } from "./broken-image";
import type { GalleryImage } from "@/features/gallery";
import type { ImageLoadStatus } from "@/features/images";

type ImageTileProps = {
  image: GalleryImage;
  mode: "viewer" | "management";
  compact?: boolean;
  isSelected?: boolean;
  onOpen?: (id: string) => void;
  onToggleSelection?: (id: string) => void;
  onLoadStatus: (id: string, status: ImageLoadStatus) => void;
};

export function ImageTile({ image, mode, compact = false, isSelected = false, onOpen, onToggleSelection, onLoadStatus }: ImageTileProps) {
  const [broken, setBroken] = useState(image.loadStatus === "broken");
  const [retryKey, setRetryKey] = useState(0);

  const retry = () => {
    setBroken(false);
    setRetryKey((value) => value + 1);
  };

  return (
    <article className={`group relative overflow-hidden border bg-white ${isSelected ? "border-emerald-600 ring-2 ring-emerald-200" : "border-slate-200"}`}>
      <button
        aria-label={mode === "management" ? "Toggle image selection" : "Open image"}
        className={`relative block w-full overflow-hidden bg-slate-100 text-left ${compact ? "aspect-square" : ""}`}
        onClick={() => mode === "management" ? onToggleSelection?.(image.id) : onOpen?.(image.id)}
        type="button"
      >
        {/* The product deliberately renders the saved external URL without proxying or optimizing it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={image.note || "Saved image"}
          className={`block w-full object-cover transition duration-200 ${compact ? "h-full" : "h-auto"} ${broken ? "opacity-0" : "opacity-100"}`}
          decoding="async"
          key={retryKey}
          loading="lazy"
          onError={() => {
            setBroken(true);
            onLoadStatus(image.id, "broken");
          }}
          onLoad={() => {
            setBroken(false);
            onLoadStatus(image.id, "available");
          }}
          src={image.originalUrl}
        />
        {broken && <BrokenImage onRetry={retry} />}
      </button>
      {!compact && <div className="space-y-2 border-t border-slate-100 p-3">
        <a className="block truncate text-xs text-slate-500 hover:text-emerald-700" href={image.originalUrl} rel="noreferrer" target="_blank" title={image.originalUrl}>
          {image.originalUrl}
        </a>
        {image.note && <p className="line-clamp-2 text-sm text-slate-800">{image.note}</p>}
        {(image.folders.length > 0 || image.tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
            {image.folders.map((folder) => <span className="inline-flex items-center gap-1" key={folder.id}><Folder size={12} />{folder.name}</span>)}
            {image.tags.map((tag) => <span className="inline-flex items-center gap-1" key={tag.id}><Tag size={12} />{tag.name}</span>)}
          </div>
        )}
      </div>}
    </article>
  );
}
