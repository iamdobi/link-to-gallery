"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { FilterSheet } from "./filter-sheet";
import { FullscreenViewer } from "./fullscreen-viewer";
import { GalleryToolbar } from "./gallery-toolbar";
import { BatchActionBar, type ClientBatchAction, type ClientBatchResult } from "./batch-action-bar";
import { AddUrlDialog } from "./add-url-dialog";
import { FolderPickerSheet } from "./folder-picker-sheet";
import { ManagementGallery } from "./management-gallery";
import { MasonryGallery } from "./masonry-gallery";
import { SquareGallery } from "./square-gallery";
import { TagPickerSheet } from "./tag-picker-sheet";
import { TrashDialog } from "./trash-dialog";
import { useGalleryState, type GalleryFilters, type GalleryPage } from "@/features/gallery";
import type { FolderRecord } from "@/features/folders";
import type { ImageLoadStatus } from "@/features/images";
import type { TagRecord } from "@/features/tags";

type GalleryShellProps = {
  initialPage: GalleryPage;
  folders: FolderRecord[];
  tags: TagRecord[];
};

function filterSearchParams(filters: Omit<GalleryFilters, "view">, cursor: string | null): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.folderId) params.set("folderId", filters.folderId);
  filters.tagIds.forEach((tagId) => params.append("tagId", tagId));
  if (filters.tagMode === "all") params.set("tagMode", "all");
  if (filters.inboxOnly) params.set("inboxOnly", "true");
  if (filters.loadStatus !== "all") params.set("loadStatus", filters.loadStatus);
  if (filters.trashOnly) params.set("trashOnly", "true");
  if (cursor) params.set("cursor", cursor);
  return params;
}

export function GalleryShell({ initialPage, folders, tags }: GalleryShellProps) {
  const gallery = useGalleryState({ initialPage });
  const { appendPage, filters, items, nextCursor, replacePage, saveScrollPosition, scrollY, selectedIds, setFilters, setSelection, toggleSelection } = gallery;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addUrlOpen, setAddUrlOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"viewer" | "management">("viewer");
  const [folderPickerAction, setFolderPickerAction] = useState<"folder_add" | "folder_remove" | null>(null);
  const [tagPickerAction, setTagPickerAction] = useState<"tag_add" | "tag_remove" | null>(null);
  const [tagOptions, setTagOptions] = useState(tags);
  const [pendingTrashAction, setPendingTrashAction] = useState<"trash" | "permanent_delete" | null>(null);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [returnTarget, setReturnTarget] = useState<{ imageId: string; scrollY: number } | null>(null);
  const initialLoad = useRef(true);
  const filterKey = useMemo(() => JSON.stringify({ ...filters, view: undefined }), [filters]);
  const dataFilters = useMemo(() => JSON.parse(filterKey) as Omit<GalleryFilters, "view">, [filterKey]);

  const loadPage = useCallback(async (cursor: string | null, append: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/images?${filterSearchParams(dataFilters, cursor).toString()}`);
      if (!response.ok) throw new Error("Unable to load images.");
      const page = await response.json() as GalleryPage;
      if (append) appendPage(page);
      else replacePage(page);
    } finally {
      setLoading(false);
    }
  }, [appendPage, dataFilters, replacePage]);

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    void loadPage(null, false);
  }, [filterKey, loadPage]);

  const updateLoadStatus = (imageId: string, loadStatus: ImageLoadStatus) => {
    void fetch(`/api/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loadStatus }),
    });
  };

  const openImage = (imageId: string) => {
    const savedScrollY = window.scrollY;
    saveScrollPosition(savedScrollY);
    setReturnTarget({ imageId, scrollY: savedScrollY });
    setActiveImageId(imageId);
  };

  const dismissFullscreen = () => {
    setActiveImageId(null);
    const target = returnTarget;
    window.requestAnimationFrame(() => {
      const restoreScrollY = target?.scrollY ?? scrollY;
      window.scrollTo({ top: restoreScrollY });
      document.getElementById(`gallery-image-${target?.imageId}`)?.focus();
    });
  };

  const applyBatch = useCallback(async (action: ClientBatchAction, targetIds?: string[]): Promise<ClientBatchResult> => {
    const response = await fetch("/api/images/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, imageIds: [...selectedIds], targetIds }),
    });
    const result = response.ok
      ? await response.json() as ClientBatchResult
      : { succeededIds: [], failed: [...selectedIds].map((id) => ({ id, message: "Unable to update image." })) };
    setBatchSummary(`${result.succeededIds.length} updated, ${result.failed.length} failed`);
    if (response.ok) await loadPage(null, false);
    return result;
  }, [loadPage, selectedIds]);

  const applyWithSelection = useCallback(async (action: ClientBatchAction, targetIds?: string[]) => {
    const result = await applyBatch(action, targetIds);
    setSelection(new Set(result.failed.map((failure) => failure.id)));
    return result;
  }, [applyBatch, setSelection]);

  const createTag = async (name: string): Promise<TagRecord | null> => {
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) return null;
    const result = await response.json() as { tag: TagRecord };
    setTagOptions((current) => current.some((tag) => tag.id === result.tag.id) ? current : [...current, result.tag]);
    return result.tag;
  };

  const changeMode = (nextMode: "viewer" | "management") => {
    if (nextMode === "management") setActiveImageId(null);
    setMode(nextMode);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <GalleryToolbar mode={mode} onModeChange={changeMode} onOpenAddUrl={() => setAddUrlOpen(true)} onOpenFilters={() => setFiltersOpen(true)} onSearchChange={(search) => setFilters({ search })} onViewChange={(view) => setFilters({ view })} search={filters.search} view={filters.view} />
      <section className={`mx-auto max-w-[1800px] px-4 py-5 sm:px-6 ${mode === "management" ? "pb-24" : ""}`}>
        {mode === "management"
          ? <ManagementGallery images={items} onLoadStatus={updateLoadStatus} onToggleSelection={toggleSelection} selectedIds={selectedIds} view={filters.view} />
          : filters.view === "masonry"
          ? <MasonryGallery images={items} onLoadStatus={updateLoadStatus} onOpen={openImage} />
          : <SquareGallery images={items} onLoadStatus={updateLoadStatus} onOpen={openImage} />}

        {items.length === 0 && !loading && <p className="py-24 text-center text-sm text-slate-500">No images match these filters.</p>}
        {nextCursor && (
          <div className="flex justify-center py-8">
            <button className="min-h-11 border border-slate-300 bg-white px-5 text-sm font-medium text-slate-800 hover:border-slate-500" disabled={loading} onClick={() => void loadPage(nextCursor, true)} type="button">
              {loading ? <span className="inline-flex items-center gap-2"><LoaderCircle className="animate-spin" size={16} />Loading</span> : "Load more"}
            </button>
          </div>
        )}
      </section>
      <FilterSheet filters={filters} folders={folders} onChange={setFilters} onClose={() => setFiltersOpen(false)} open={filtersOpen} tags={tagOptions} />
      <AddUrlDialog onClose={() => setAddUrlOpen(false)} onSaved={() => loadPage(null, false)} open={addUrlOpen} />
      {folderPickerAction && <FolderPickerSheet action={folderPickerAction} folders={folders} onClose={() => setFolderPickerAction(null)} onConfirm={(folderIds) => { const action = folderPickerAction; setFolderPickerAction(null); void applyWithSelection(action, folderIds); }} open />}
      {tagPickerAction && <TagPickerSheet action={tagPickerAction} onClose={() => setTagPickerAction(null)} onConfirm={(tagIds) => { const action = tagPickerAction; setTagPickerAction(null); void applyWithSelection(action, tagIds); }} onCreate={createTag} open tags={tagOptions} />}
      <TrashDialog count={selectedIds.size} onClose={() => setPendingTrashAction(null)} onConfirm={() => { const action = pendingTrashAction; setPendingTrashAction(null); if (action) void applyWithSelection(action); }} open={pendingTrashAction !== null} permanent={pendingTrashAction === "permanent_delete"} />
      {mode === "management" && <>
        {batchSummary && <p aria-live="polite" className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">{batchSummary}</p>}
        <BatchActionBar apply={applyWithSelection} onConfirmPermanentDelete={() => setPendingTrashAction("permanent_delete")} onConfirmTrash={() => setPendingTrashAction("trash")} onOpenFolders={() => setFolderPickerAction("folder_add")} onOpenTags={() => setTagPickerAction("tag_add")} onRemoveFolders={() => setFolderPickerAction("folder_remove")} onRemoveTags={() => setTagPickerAction("tag_remove")} onSelectionChange={setSelection} selectedIds={selectedIds} trashOnly={filters.trashOnly} />
      </>}
      {activeImageId && mode === "viewer" && <FullscreenViewer imageId={activeImageId} images={items} onDismiss={dismissFullscreen} onNavigate={setActiveImageId} />}
    </main>
  );
}
