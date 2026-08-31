"use client";

import { useState } from "react";
import { FolderMinus, FolderPlus, RotateCcw, Tag, TagX, Trash2, X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export type ClientBatchAction = "folder_add" | "folder_remove" | "tag_add" | "tag_remove" | "trash" | "restore" | "permanent_delete";
export type ClientBatchResult = { succeededIds: string[]; failed: Array<{ id: string; message: string }> };

type BatchActionBarProps = {
  selectedIds: Set<string>;
  trashOnly: boolean;
  apply: (action: ClientBatchAction) => Promise<ClientBatchResult>;
  onOpenFolders: () => void;
  onRemoveFolders: () => void;
  onOpenTags: () => void;
  onRemoveTags: () => void;
  onSelectionChange: (ids: Set<string>) => void;
  onConfirmTrash: () => void;
  onConfirmPermanentDelete: () => void;
};

export function BatchActionBar({ selectedIds, trashOnly, apply, onOpenFolders, onRemoveFolders, onOpenTags, onRemoveTags, onSelectionChange, onConfirmTrash, onConfirmPermanentDelete }: BatchActionBarProps) {
  const [busy, setBusy] = useState(false);
  const count = selectedIds.size;

  const run = async (action: ClientBatchAction) => {
    setBusy(true);
    try {
      const result = await apply(action);
      onSelectionChange(new Set(result.failed.map((failure) => failure.id)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-300 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_20px_rgba(15,23,42,0.10)]">
      <div className="mx-auto flex min-h-16 max-w-[1800px] items-center gap-2 overflow-x-auto px-4 sm:px-6">
        <span className="min-w-20 text-sm font-semibold text-slate-900">{count} selected</span>
        {trashOnly ? <>
          <IconButton disabled={!count || busy} label="Restore selected images" onClick={() => void run("restore")}><RotateCcw size={19} /></IconButton>
          <IconButton disabled={!count || busy} label="Permanently delete selected images" onClick={onConfirmPermanentDelete}><Trash2 size={19} /></IconButton>
        </> : <>
          <IconButton disabled={!count || busy} label="Add folders to selected images" onClick={onOpenFolders}><FolderPlus size={19} /></IconButton>
          <IconButton disabled={!count || busy} label="Remove folders from selected images" onClick={onRemoveFolders}><FolderMinus size={19} /></IconButton>
          <IconButton disabled={!count || busy} label="Add tags to selected images" onClick={onOpenTags}><Tag size={19} /></IconButton>
          <IconButton disabled={!count || busy} label="Remove tags from selected images" onClick={onRemoveTags}><TagX size={19} /></IconButton>
          <IconButton disabled={!count || busy} label="Trash selected images" onClick={onConfirmTrash}><Trash2 size={19} /></IconButton>
        </>}
        <IconButton disabled={!count || busy} label="Clear image selection" onClick={() => onSelectionChange(new Set())}><X size={19} /></IconButton>
      </div>
    </div>
  );
}
