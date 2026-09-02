"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import type { TagRecord } from "@/features/tags";

type TagPickerSheetProps = {
  open: boolean;
  tags: TagRecord[];
  action: "tag_add" | "tag_remove";
  onClose: () => void;
  onConfirm: (tagIds: string[]) => void | Promise<void>;
  onCreate: (name: string) => Promise<TagRecord | null>;
  confirmLabel?: string;
};

export function TagPickerSheet({ open, tags, action, onClose, onConfirm, onCreate, confirmLabel }: TagPickerSheetProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const visibleTags = tags.filter((tag) => tag.normalizedName.includes(query.trim().toLowerCase()));

  const toggle = (tagId: string) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    return next;
  });

  const createTag = async () => {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const tag = await onCreate(query);
      if (tag) setSelectedIds((current) => new Set([...current, tag.id]));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sheet onClose={onClose} open={open} title={action === "tag_add" ? "Add tags" : "Remove tags"}>
      <div className="space-y-3">
        <div className="flex gap-2"><input aria-label="Find or create tag" className="h-10 min-w-0 flex-1 border border-slate-300 px-3 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Find or create a tag" value={query} />{action === "tag_add" && <button className="min-h-10 border border-slate-700 px-3 text-sm font-medium text-slate-800 disabled:opacity-50" disabled={!query.trim() || creating} onClick={() => void createTag()} type="button">Create</button>}</div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {visibleTags.map((tag) => <label className="flex min-h-11 items-center gap-3 text-sm text-slate-800" key={tag.id}><input checked={selectedIds.has(tag.id)} onChange={() => toggle(tag.id)} type="checkbox" />{tag.name}</label>)}
        </div>
      </div>
      <button className="mt-6 min-h-11 w-full bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50" disabled={!selectedIds.size} onClick={() => void onConfirm([...selectedIds])} type="button">{confirmLabel ?? (action === "tag_add" ? "Add to selected images" : "Remove from selected images")}</button>
    </Sheet>
  );
}
