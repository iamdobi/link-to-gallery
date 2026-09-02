"use client";

import { useState } from "react";
import { FolderPlus, SkipForward, Tags, X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { FolderPickerSheet } from "./folder-picker-sheet";
import { TagPickerSheet } from "./tag-picker-sheet";
import type { GalleryImage, GalleryPage } from "@/features/gallery";
import type { FolderRecord } from "@/features/folders";
import type { TagRecord } from "@/features/tags";

type InboxTriageProps = {
  initialPage: GalleryPage;
  initialError?: string;
  inboxCount: number;
  folders: FolderRecord[];
  tags: TagRecord[];
  onClose: () => void;
  onCreateTag: (name: string) => Promise<TagRecord | null>;
  onAssigned: () => void;
};

type TriageAction = "folder_add" | "tag_add";
type BatchResult = { succeededIds: string[]; failed: Array<{ id: string; message: string }> };

function inboxUrl(cursor: string | null): string {
  const params = new URLSearchParams({ inboxOnly: "true" });
  if (cursor) params.set("cursor", cursor);
  return `/api/images?${params.toString()}`;
}

export function InboxTriage({ initialPage, initialError, inboxCount, folders, tags, onClose, onCreateTag, onAssigned }: InboxTriageProps) {
  const [queue, setQueue] = useState<GalleryImage[]>(initialPage.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialPage.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pickerAction, setPickerAction] = useState<TriageAction | null>(null);

  const loadNextPage = async (cursor: string) => {
    setLoading(true);
    try {
      const response = await fetch(inboxUrl(cursor));
      if (!response.ok) throw new Error("Unable to load Inbox images.");
      const page = await response.json() as GalleryPage;
      setQueue((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Inbox images.");
    } finally {
      setLoading(false);
    }
  };

  const advance = () => {
    const remaining = queue.slice(1);
    setError(null);
    setQueue(remaining);
    if (remaining.length <= 2 && nextCursor && !loading) void loadNextPage(nextCursor);
  };

  const assign = async (action: TriageAction, targetIds: string[]) => {
    const image = queue[0];
    if (!image) return;

    try {
      const response = await fetch("/api/images/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, imageIds: [image.id], targetIds }),
      });
      const result = response.ok
        ? await response.json() as BatchResult
        : { succeededIds: [], failed: [{ id: image.id, message: "Unable to organize image." }] };
      if (!result.succeededIds.includes(image.id)) {
        setPickerAction(null);
        setError(result.failed[0]?.message ?? "Unable to organize image.");
        return;
      }

      setPickerAction(null);
      advance();
      onAssigned();
    } catch {
      setPickerAction(null);
      setError("Unable to organize image.");
    }
  };

  const image = queue[0];

  return (
    <div aria-label="Organize Inbox" aria-modal="true" className="fixed inset-0 z-30 flex flex-col bg-slate-50 text-slate-950" role="dialog">
      <header className="flex min-h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">Organize Inbox</h2>
          <p className="text-xs text-slate-500">{inboxCount} Inbox images</p>
        </div>
        <IconButton label="Close Inbox organizer" onClick={onClose} size="touch"><X size={20} /></IconButton>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 p-4 sm:p-6">
        {loading && !image && <p className="py-16 text-center text-sm text-slate-500">Loading Inbox...</p>}
        {!loading && !image && !error && <p className="py-16 text-center text-sm text-slate-500">Inbox is clear.</p>}
        {image && <>
          <div className="min-h-0 flex-1 bg-slate-200">
            {/* The gallery deliberately displays the saved source URL without a proxy. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Inbox image" className="h-full max-h-[calc(100dvh-15rem)] w-full object-contain" src={image.originalUrl} />
          </div>
          <a className="break-all text-xs text-slate-600 hover:text-emerald-700" href={image.originalUrl} rel="noreferrer" target="_blank">{image.originalUrl}</a>
          {error && <p aria-live="polite" className="text-sm text-rose-700">{error}</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button className="min-h-12 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:border-slate-500 disabled:opacity-50" disabled={loading} onClick={() => setPickerAction("folder_add")} type="button"><span className="inline-flex items-center gap-2"><FolderPlus size={18} />Add folders</span></button>
            <button className="min-h-12 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:border-slate-500 disabled:opacity-50" disabled={loading} onClick={() => setPickerAction("tag_add")} type="button"><span className="inline-flex items-center gap-2"><Tags size={18} />Add tags</span></button>
            <button className="min-h-12 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:border-slate-500 disabled:opacity-50" disabled={loading} onClick={advance} type="button"><span className="inline-flex items-center gap-2"><SkipForward size={18} />Skip</span></button>
          </div>
        </>}
        {error && !image && <p aria-live="polite" className="text-center text-sm text-rose-700">{error}</p>}
      </div>
      {pickerAction === "folder_add" && <FolderPickerSheet action="folder_add" confirmLabel="Organize and continue" folders={folders} onClose={() => setPickerAction(null)} onConfirm={(folderIds) => assign("folder_add", folderIds)} open />}
      {pickerAction === "tag_add" && <TagPickerSheet action="tag_add" confirmLabel="Organize and continue" onClose={() => setPickerAction(null)} onConfirm={(tagIds) => assign("tag_add", tagIds)} onCreate={onCreateTag} open tags={tags} />}
    </div>
  );
}
