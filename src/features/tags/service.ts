import { normalizeTagName } from "@/lib/organization";
import type { CreateTagResult, TagRepository } from "./types";

export async function listTags(repository: TagRepository, ownerId: string) {
  return repository.list(ownerId);
}

export async function createTag(
  repository: TagRepository,
  ownerId: string,
  name: string,
): Promise<CreateTagResult> {
  const value = normalizeTagName(name);
  const existing = await repository.findByNormalizedName(ownerId, value.normalizedName);
  if (existing) return { kind: "duplicate", tag: existing };

  return {
    kind: "created",
    tag: await repository.create(ownerId, { name: value.displayName, normalizedName: value.normalizedName }),
  };
}

export async function renameTag(
  repository: TagRepository,
  ownerId: string,
  tagId: string,
  name: string,
) {
  const value = normalizeTagName(name);
  const existing = await repository.findByNormalizedName(ownerId, value.normalizedName);
  if (existing && existing.id !== tagId) throw new Error("A tag with this name already exists.");

  return repository.rename(ownerId, tagId, { name: value.displayName, normalizedName: value.normalizedName });
}

export async function mergeTags(
  repository: TagRepository,
  ownerId: string,
  sourceTagId: string,
  targetTagId: string,
) {
  if (sourceTagId === targetTagId) throw new Error("A tag cannot be merged into itself.");
  return repository.merge(ownerId, sourceTagId, targetTagId);
}

export async function deleteTag(repository: TagRepository, ownerId: string, tagId: string) {
  return repository.delete(ownerId, tagId);
}
