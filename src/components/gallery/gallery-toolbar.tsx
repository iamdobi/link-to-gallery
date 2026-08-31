"use client";

import { CheckSquare, Columns3, Eye, Grid2X2, Search, SlidersHorizontal } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import type { GalleryView } from "@/features/gallery";

type GalleryToolbarProps = {
  search: string;
  view: GalleryView;
  mode: "viewer" | "management";
  onSearchChange: (search: string) => void;
  onViewChange: (view: GalleryView) => void;
  onOpenFilters: () => void;
  onModeChange: (mode: "viewer" | "management") => void;
};

export function GalleryToolbar({ search, view, mode, onSearchChange, onViewChange, onOpenFilters, onModeChange }: GalleryToolbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1800px] items-center gap-2 px-4 sm:px-6">
        <h1 className="mr-2 whitespace-nowrap text-lg font-semibold text-slate-950">Link Gallery</h1>
        <label className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input aria-label="Search images" className="h-10 w-full border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600" onChange={(event) => onSearchChange(event.target.value)} placeholder="Search URLs, notes, and tags" value={search} />
        </label>
        <IconButton label="Open filters" onClick={onOpenFilters}><SlidersHorizontal size={18} /></IconButton>
        <IconButton label={mode === "viewer" ? "Enter management mode" : "Return to viewer mode"} onClick={() => onModeChange(mode === "viewer" ? "management" : "viewer")}>{mode === "viewer" ? <CheckSquare size={18} /> : <Eye size={18} />}</IconButton>
        <div aria-label="Gallery layout" className="flex border border-slate-300" role="group">
          <button aria-label="Masonry view" className={`inline-flex size-10 items-center justify-center ${view === "masonry" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`} onClick={() => onViewChange("masonry")} title="Masonry view" type="button"><Columns3 size={18} /></button>
          <button aria-label="Square grid view" className={`inline-flex size-10 items-center justify-center ${view === "square" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`} onClick={() => onViewChange("square")} title="Square grid view" type="button"><Grid2X2 size={18} /></button>
        </div>
      </div>
    </header>
  );
}
