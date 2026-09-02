"use client";

import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import type { FolderRecord } from "@/features/folders";

type FolderPickerSheetProps = {
  open: boolean;
  folders: FolderRecord[];
  action: "folder_add" | "folder_remove";
  onClose: () => void;
  onConfirm: (folderIds: string[]) => void | Promise<void>;
  confirmLabel?: string;
};

function folderDepth(folder: FolderRecord, byId: Map<string, FolderRecord>): number {
  let depth = 0;
  let parentId = folder.parentId;
  while (parentId) {
    depth += 1;
    parentId = byId.get(parentId)?.parentId ?? null;
  }
  return depth;
}

export function FolderPickerSheet({ open, folders, action, onClose, onConfirm, confirmLabel }: FolderPickerSheetProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const sortedFolders = useMemo(() => {
    const byId = new Map(folders.map((folder) => [folder.id, folder]));
    return [...folders].sort((a, b) => folderDepth(a, byId) - folderDepth(b, byId) || a.name.localeCompare(b.name));
  }, [folders]);
  const byId = useMemo(() => new Map(folders.map((folder) => [folder.id, folder])), [folders]);

  const toggle = (folderId: string) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(folderId)) next.delete(folderId);
    else next.add(folderId);
    return next;
  });

  return (
    <Sheet onClose={onClose} open={open} title={action === "folder_add" ? "Add folders" : "Remove folders"}>
      <div className="space-y-2">
        {sortedFolders.map((folder) => <label className="flex min-h-11 items-center gap-3 text-sm text-slate-800" key={folder.id} style={{ paddingLeft: `${folderDepth(folder, byId) * 16}px` }}><input checked={selectedIds.has(folder.id)} onChange={() => toggle(folder.id)} type="checkbox" />{folder.name}</label>)}
        {!folders.length && <p className="py-8 text-sm text-slate-500">No folders yet.</p>}
      </div>
      <button className="mt-6 min-h-11 w-full bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50" disabled={!selectedIds.size} onClick={() => void onConfirm([...selectedIds])} type="button">{confirmLabel ?? (action === "folder_add" ? "Add to selected images" : "Remove from selected images")}</button>
    </Sheet>
  );
}
