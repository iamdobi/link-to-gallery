import { validateFolderMove } from "@/lib/organization";
import type { FolderRepository } from "./types";

function normalizeFolderName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error("A folder name is required.");
  return normalized;
}

export async function listFolders(repository: FolderRepository, ownerId: string) {
  return repository.list(ownerId);
}

export async function createFolder(
  repository: FolderRepository,
  ownerId: string,
  input: { name: string; parentId?: string | null },
) {
  const parentId = input.parentId ?? null;
  if (parentId) {
    const folders = await repository.list(ownerId);
    if (!folders.some((folder) => folder.id === parentId)) throw new Error("The target parent does not exist.");
  }

  return repository.create(ownerId, { name: normalizeFolderName(input.name), parentId });
}

export async function renameFolder(
  repository: FolderRepository,
  ownerId: string,
  folderId: string,
  name: string,
) {
  return repository.update(ownerId, folderId, { name: normalizeFolderName(name) });
}

export async function moveFolder(
  repository: FolderRepository,
  ownerId: string,
  folderId: string,
  parentId: string | null,
) {
  const folders = await repository.list(ownerId);
  validateFolderMove(folders, folderId, parentId);
  return repository.update(ownerId, folderId, { parentId });
}

export async function deleteFolder(repository: FolderRepository, ownerId: string, folderId: string) {
  return repository.delete(ownerId, folderId);
}
