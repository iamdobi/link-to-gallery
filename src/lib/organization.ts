export type FolderTreeNode = {
  id: string;
  parentId: string | null;
};

export function normalizeTagName(name: string): { displayName: string; normalizedName: string } {
  const displayName = name.trim().replace(/\s+/g, " ");
  if (!displayName) throw new Error("A tag name is required.");

  return { displayName, normalizedName: displayName.toLocaleLowerCase() };
}

export function validateFolderMove(
  tree: FolderTreeNode[],
  folderId: string,
  parentId: string | null,
): void {
  if (parentId === null) return;
  if (folderId === parentId) throw new Error("A folder cannot be its own parent.");

  const byId = new Map(tree.map((folder) => [folder.id, folder]));
  if (!byId.has(folderId)) throw new Error("The folder does not exist.");

  let currentId: string | null = parentId;
  const visited = new Set<string>();
  while (currentId !== null) {
    if (currentId === folderId) throw new Error("A folder cannot be moved below its descendant.");
    if (visited.has(currentId)) throw new Error("The folder tree contains a cycle.");
    visited.add(currentId);

    const current = byId.get(currentId);
    if (!current) throw new Error("The target parent does not exist.");
    currentId = current.parentId;
  }
}
