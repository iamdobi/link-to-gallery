"use client";

import { useState } from "react";
import { Check, CheckSquare, Columns3, Eye, Grid2X2, Inbox, LogOut, Menu, Plus, Search, SlidersHorizontal } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { Sheet } from "@/components/ui/sheet";
import type { GalleryCounts, GalleryView } from "@/features/gallery";

type GalleryToolbarProps = {
  search: string;
  view: GalleryView;
  mode: "viewer" | "management";
  counts: GalleryCounts;
  onSearchChange: (search: string) => void;
  onViewChange: (view: GalleryView) => void;
  onOpenFilters: () => void;
  onOpenAddUrl: () => void;
  onModeChange: (mode: "viewer" | "management") => void;
  onOpenInboxTriage: () => void;
};

type SearchInputProps = Pick<GalleryToolbarProps, "search" | "onSearchChange"> & {
  className?: string;
};

function SearchInput({ search, onSearchChange, className = "" }: SearchInputProps) {
  return (
    <label className={`relative min-w-0 flex-1 ${className}`}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input aria-label="Search images" className="h-10 w-full border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600" onChange={(event) => onSearchChange(event.target.value)} placeholder="Search URLs, notes, and tags" value={search} />
    </label>
  );
}

function DesktopSignOut() {
  return <form action="/auth/sign-out" method="post"><IconButton label="Log out" type="submit"><LogOut size={18} /></IconButton></form>;
}

function MobileSignOut() {
  return (
    <form action="/auth/sign-out" method="post">
      <button className="flex min-h-12 w-full items-center gap-3 border border-rose-300 px-3 text-sm font-medium text-rose-700" type="submit">
        <LogOut size={18} />
        Log out
      </button>
    </form>
  );
}

export function GalleryToolbar({ search, view, mode, counts, onSearchChange, onViewChange, onOpenFilters, onOpenAddUrl, onModeChange, onOpenInboxTriage }: GalleryToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nextMode = mode === "viewer" ? "management" : "viewer";
  const modeLabel = mode === "viewer" ? "Enter management mode" : "Return to viewer mode";
  const closeThen = (callback: () => void) => {
    setMenuOpen(false);
    callback();
  };

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto hidden min-h-16 max-w-[1800px] items-center gap-2 px-4 sm:flex sm:px-6">
          <div className="mr-2 whitespace-nowrap">
            <h1 className="text-lg font-semibold text-slate-950">Link Gallery</h1>
            <p className="text-xs text-slate-500"><span>{counts.active} images</span><span aria-hidden="true"> · </span><span>{counts.inbox} Inbox</span></p>
          </div>
          <SearchInput onSearchChange={onSearchChange} search={search} />
          <IconButton label="Add image URL" onClick={onOpenAddUrl}><Plus size={18} /></IconButton>
          <IconButton label="Organize Inbox" onClick={onOpenInboxTriage}><Inbox size={18} /></IconButton>
          <IconButton label="Open filters" onClick={onOpenFilters}><SlidersHorizontal size={18} /></IconButton>
          <IconButton label={modeLabel} onClick={() => onModeChange(nextMode)}>{mode === "viewer" ? <CheckSquare size={18} /> : <Eye size={18} />}</IconButton>
          <div aria-label="Gallery layout" className="flex border border-slate-300" role="group">
            <button aria-label="Masonry view" className={`inline-flex size-10 items-center justify-center ${view === "masonry" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`} onClick={() => onViewChange("masonry")} title="Masonry view" type="button"><Columns3 size={18} /></button>
            <button aria-label="Square grid view" className={`inline-flex size-10 items-center justify-center ${view === "square" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`} onClick={() => onViewChange("square")} title="Square grid view" type="button"><Grid2X2 size={18} /></button>
          </div>
          <DesktopSignOut />
        </div>
        <div className="mx-auto px-4 sm:hidden">
          <div className="flex min-h-14 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-950">Link Gallery</h1>
              <p className="text-xs text-slate-500"><span>{counts.active} images</span><span aria-hidden="true"> · </span><span>{counts.inbox} Inbox</span></p>
            </div>
            <IconButton label="Open gallery menu" onClick={() => setMenuOpen(true)}><Menu size={20} /></IconButton>
          </div>
          <SearchInput className="block pb-3" onSearchChange={onSearchChange} search={search} />
        </div>
      </header>
      <Sheet onClose={() => setMenuOpen(false)} open={menuOpen} title="Gallery menu">
        <div className="space-y-5">
          <div className="space-y-1">
            <button className="flex min-h-12 w-full items-center gap-3 border-b border-slate-200 px-1 text-left text-sm font-medium text-slate-800" onClick={() => closeThen(onOpenAddUrl)} type="button"><Plus size={18} />Add image URL</button>
            <button className="flex min-h-12 w-full items-center gap-3 border-b border-slate-200 px-1 text-left text-sm font-medium text-slate-800" onClick={() => closeThen(onOpenInboxTriage)} type="button"><Inbox size={18} />Organize Inbox</button>
            <button className="flex min-h-12 w-full items-center gap-3 border-b border-slate-200 px-1 text-left text-sm font-medium text-slate-800" onClick={() => closeThen(onOpenFilters)} type="button"><SlidersHorizontal size={18} />Filters</button>
            <button className="flex min-h-12 w-full items-center gap-3 border-b border-slate-200 px-1 text-left text-sm font-medium text-slate-800" onClick={() => closeThen(() => onModeChange(nextMode))} type="button">{mode === "viewer" ? <CheckSquare size={18} /> : <Eye size={18} />}{modeLabel}</button>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-slate-900">Gallery layout</legend>
            <div className="flex border border-slate-300" role="group">
              <button className={`flex min-h-11 flex-1 items-center justify-center gap-2 text-sm font-medium ${view === "masonry" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`} onClick={() => closeThen(() => onViewChange("masonry"))} type="button"><Columns3 size={18} />Masonry{view === "masonry" && <Check size={16} />}</button>
              <button className={`flex min-h-11 flex-1 items-center justify-center gap-2 text-sm font-medium ${view === "square" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`} onClick={() => closeThen(() => onViewChange("square"))} type="button"><Grid2X2 size={18} />Grid{view === "square" && <Check size={16} />}</button>
            </div>
          </fieldset>
          <MobileSignOut />
        </div>
      </Sheet>
    </>
  );
}
