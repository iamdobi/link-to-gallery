import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultGalleryFilters,
  type GalleryFilters,
  type GalleryCounts,
  type GalleryFolder,
  type GalleryImage,
  type GalleryPage,
  type GalleryTag,
} from "@/features/gallery";

const PAGE_SIZE = 48;
const imageColumns = "id, original_url, url_fingerprint, note, load_status, last_load_checked_at, deleted_at, created_at, updated_at";

type ImageRow = {
  id: string;
  original_url: string;
  url_fingerprint: string;
  note: string;
  load_status: GalleryImage["loadStatus"];
  last_load_checked_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type Cursor = { createdAt: string; id: string };

function resolvedFilters(filters: Partial<GalleryFilters>): GalleryFilters {
  return { ...defaultGalleryFilters, ...filters, tagIds: filters.tagIds ?? defaultGalleryFilters.tagIds };
}

export function buildImageFilter(filters: Partial<GalleryFilters>): string {
  const value = resolvedFilters(filters);
  const rules = [value.trashOnly ? "trashed images" : "active images"];
  if (value.inboxOnly) rules.push("no folder and no tag");
  if (value.folderId) rules.push("selected folder");
  if (value.tagIds.length) rules.push(value.tagMode === "all" ? `both tags (${value.tagIds.length})` : "any selected tag");
  if (value.loadStatus !== "all") rules.push(`${value.loadStatus} image status`);
  if (value.search.trim()) rules.push("URL, note, or tag search");
  return rules.join("; ");
}

export async function getGalleryCounts(supabase: SupabaseClient, ownerId: string): Promise<GalleryCounts> {
  const [active, inbox] = await Promise.all([
    supabase
      .from("images")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .is("deleted_at", null),
    supabase
      .from("images")
      .select("id,image_folders!left(image_id),image_tags!left(image_id)", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .is("deleted_at", null)
      .is("image_folders.image_id", null)
      .is("image_tags.image_id", null),
  ]);
  if (active.error) throw new Error(active.error.message);
  if (inbox.error) throw new Error(inbox.error.message);

  return { active: active.count ?? 0, inbox: inbox.count ?? 0 };
}

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(cursor: string | null): Cursor | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Cursor;
    return typeof parsed.createdAt === "string" && typeof parsed.id === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function toGalleryImage(row: ImageRow, folders: GalleryFolder[], tags: GalleryTag[]): GalleryImage {
  return {
    id: row.id,
    originalUrl: row.original_url,
    urlFingerprint: row.url_fingerprint,
    note: row.note,
    loadStatus: row.load_status,
    lastLoadCheckedAt: row.last_load_checked_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    folders,
    tags,
  };
}

function intersectIds(current: Set<string> | null, next: string[]): Set<string> {
  const nextSet = new Set(next);
  return current ? new Set([...current].filter((id) => nextSet.has(id))) : nextSet;
}

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

async function imageIdsForTags(
  supabase: SupabaseClient,
  tagIds: string[],
  tagMode: GalleryFilters["tagMode"],
): Promise<string[]> {
  const { data, error } = await supabase.from("image_tags").select("image_id, tag_id").in("tag_id", tagIds);
  if (error) throw new Error(error.message);

  const matches = new Map<string, Set<string>>();
  for (const link of data ?? []) {
    const imageId = link.image_id as string;
    const ids = matches.get(imageId) ?? new Set<string>();
    ids.add(link.tag_id as string);
    matches.set(imageId, ids);
  }

  return [...matches]
    .filter(([, ids]) => tagMode === "any" || ids.size === tagIds.length)
    .map(([imageId]) => imageId);
}

async function imageIdsForFolder(supabase: SupabaseClient, folderId: string): Promise<string[]> {
  const { data, error } = await supabase.from("image_folders").select("image_id").eq("folder_id", folderId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((link) => link.image_id as string);
}

async function imageIdsForTagSearch(supabase: SupabaseClient, term: string): Promise<string[]> {
  const { data: tags, error: tagError } = await supabase
    .from("tags")
    .select("id")
    .ilike("name_normalized", `%${term}%`);
  if (tagError) throw new Error(tagError.message);
  if (!tags?.length) return [];

  const { data: links, error: linkError } = await supabase
    .from("image_tags")
    .select("image_id")
    .in("tag_id", tags.map((tag) => tag.id as string));
  if (linkError) throw new Error(linkError.message);
  return (links ?? []).map((link) => link.image_id as string);
}

async function loadRelationships(
  supabase: SupabaseClient,
  imageIds: string[],
): Promise<{ foldersByImage: Map<string, GalleryFolder[]>; tagsByImage: Map<string, GalleryTag[]> }> {
  const foldersByImage = new Map<string, GalleryFolder[]>();
  const tagsByImage = new Map<string, GalleryTag[]>();
  if (!imageIds.length) return { foldersByImage, tagsByImage };

  const [{ data: folderLinks, error: folderError }, { data: tagLinks, error: tagError }] = await Promise.all([
    supabase.from("image_folders").select("image_id, folders(id, name, parent_id)").in("image_id", imageIds),
    supabase.from("image_tags").select("image_id, tags(id, name, name_normalized)").in("image_id", imageIds),
  ]);
  if (folderError) throw new Error(folderError.message);
  if (tagError) throw new Error(tagError.message);

  for (const link of folderLinks ?? []) {
    const folder = firstRelation(link.folders as unknown as { id: string; name: string; parent_id: string | null } | Array<{ id: string; name: string; parent_id: string | null }> | null);
    if (!folder) continue;
    const imageId = link.image_id as string;
    foldersByImage.set(imageId, [...(foldersByImage.get(imageId) ?? []), {
      id: folder.id,
      name: folder.name,
      parentId: folder.parent_id,
    }]);
  }

  for (const link of tagLinks ?? []) {
    const tag = firstRelation(link.tags as unknown as { id: string; name: string; name_normalized: string } | Array<{ id: string; name: string; name_normalized: string }> | null);
    if (!tag) continue;
    const imageId = link.image_id as string;
    tagsByImage.set(imageId, [...(tagsByImage.get(imageId) ?? []), {
      id: tag.id,
      name: tag.name,
      normalizedName: tag.name_normalized,
    }]);
  }

  return { foldersByImage, tagsByImage };
}

export async function getImagePage(
  supabase: SupabaseClient,
  ownerId: string,
  filters: Partial<GalleryFilters>,
  cursor: string | null,
): Promise<GalleryPage> {
  const value = resolvedFilters(filters);
  let candidateIds: Set<string> | null = null;

  if (value.folderId) candidateIds = intersectIds(candidateIds, await imageIdsForFolder(supabase, value.folderId));
  if (value.tagIds.length) candidateIds = intersectIds(candidateIds, await imageIdsForTags(supabase, value.tagIds, value.tagMode));
  if (candidateIds && candidateIds.size === 0) return { items: [], nextCursor: null };

  const search = value.search.trim();
  const tagSearchIds = search ? await imageIdsForTagSearch(supabase, search.toLowerCase()) : [];
  const searchPattern = `%${search.replace(/[%,()]/g, " ")}%`;
  const selectedColumns = value.inboxOnly
    ? `${imageColumns},image_folders!left(image_id),image_tags!left(image_id)`
    : imageColumns;

  let query = supabase
    .from("images")
    .select(selectedColumns)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);

  query = value.trashOnly ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (value.loadStatus !== "all") query = query.eq("load_status", value.loadStatus);
  if (value.inboxOnly) query = query.is("image_folders.image_id", null).is("image_tags.image_id", null);
  if (candidateIds) query = query.in("id", [...candidateIds]);
  if (search) {
    const searchRules = [`original_url.ilike.${searchPattern}`, `note.ilike.${searchPattern}`];
    if (tagSearchIds.length) searchRules.push(`id.in.(${tagSearchIds.join(",")})`);
    query = query.or(searchRules.join(","));
  }

  const decodedCursor = decodeCursor(cursor);
  if (decodedCursor) {
    query = query.or(`created_at.lt.${decodedCursor.createdAt},and(created_at.eq.${decodedCursor.createdAt},id.lt.${decodedCursor.id})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = ((data ?? []) as unknown as ImageRow[]).slice(0, PAGE_SIZE);
  const { foldersByImage, tagsByImage } = await loadRelationships(supabase, rows.map((row) => row.id));
  const items = rows.map((row) => toGalleryImage(row, foldersByImage.get(row.id) ?? [], tagsByImage.get(row.id) ?? []));
  const hasMore = (data?.length ?? 0) > PAGE_SIZE;
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
  };
}
