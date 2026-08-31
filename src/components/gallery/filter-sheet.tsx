"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import type { FolderRecord } from "@/features/folders";
import type { GalleryFilters } from "@/features/gallery";
import type { TagRecord } from "@/features/tags";

type FilterSheetProps = {
  open: boolean;
  folders: FolderRecord[];
  tags: TagRecord[];
  filters: GalleryFilters;
  onChange: (updates: Partial<GalleryFilters>) => void;
  onClose: () => void;
};

export function FilterSheet({ open, folders, tags, filters, onChange, onClose }: FilterSheetProps) {
  const [tagQuery, setTagQuery] = useState("");
  const visibleTags = tags.filter((tag) => tag.normalizedName.includes(tagQuery.trim().toLowerCase()));

  const toggleTag = (tagId: string) => {
    const tagIds = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter((id) => id !== tagId)
      : [...filters.tagIds, tagId];
    onChange({ tagIds });
  };

  return (
    <Sheet onClose={onClose} open={open} title="Filters">
      <div className="space-y-7">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-900">Collection</legend>
          <label className="flex min-h-10 items-center gap-3 text-sm text-slate-700"><input checked={filters.inboxOnly} onChange={(event) => onChange({ inboxOnly: event.target.checked })} type="checkbox" />Inbox only</label>
          <label className="flex min-h-10 items-center gap-3 text-sm text-slate-700"><input checked={filters.trashOnly} onChange={(event) => onChange({ trashOnly: event.target.checked })} type="checkbox" />Trash only</label>
          <select aria-label="Folder filter" className="h-10 w-full border border-slate-300 bg-white px-3 text-sm" onChange={(event) => onChange({ folderId: event.target.value || null })} value={filters.folderId ?? ""}>
            <option value="">All folders</option>
            {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900">Tags</legend>
          <div className="flex border border-slate-300" role="group">
            <button className={`min-h-10 flex-1 text-sm ${filters.tagMode === "any" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`} onClick={() => onChange({ tagMode: "any" })} type="button">Any</button>
            <button className={`min-h-10 flex-1 text-sm ${filters.tagMode === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`} onClick={() => onChange({ tagMode: "all" })} type="button">All</button>
          </div>
          <input aria-label="Filter tag list" className="h-10 w-full border border-slate-300 px-3 text-sm" onChange={(event) => setTagQuery(event.target.value)} placeholder="Find tags" value={tagQuery} />
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {visibleTags.map((tag) => <label className="flex min-h-10 items-center gap-3 px-1 text-sm text-slate-700" key={tag.id}><input checked={filters.tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} type="checkbox" />{tag.name}</label>)}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-900">Image status</legend>
          <select aria-label="Image status" className="h-10 w-full border border-slate-300 bg-white px-3 text-sm" onChange={(event) => onChange({ loadStatus: event.target.value as GalleryFilters["loadStatus"] })} value={filters.loadStatus}>
            <option value="all">All images</option>
            <option value="available">Available</option>
            <option value="broken">Broken</option>
          </select>
        </fieldset>
      </div>
    </Sheet>
  );
}
