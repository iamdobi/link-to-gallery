import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImageRecord, ImageRepository } from "@/features/images";

const imageColumns = "id, original_url, url_fingerprint, note, load_status, last_load_checked_at, deleted_at, created_at, updated_at";

type ImageRow = {
  id: string;
  original_url: string;
  url_fingerprint: string;
  note: string;
  load_status: ImageRecord["loadStatus"];
  last_load_checked_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

function toImageRecord(row: ImageRow): ImageRecord {
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
  };
}

function throwIfError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

function requireData<T>(data: T | null, error: { message: string } | null): T {
  throwIfError(error);
  if (data === null) throw new Error("The image operation returned no data.");
  return data;
}

export function createSupabaseImageRepository(supabase: SupabaseClient): ImageRepository {
  return {
    async findActiveByFingerprint(ownerId, fingerprint) {
      const { data, error } = await supabase
        .from("images")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("url_fingerprint", fingerprint)
        .is("deleted_at", null)
        .maybeSingle();

      throwIfError(error);
      return data ? { id: data.id as string } : null;
    },

    async insert(image) {
      const { data, error } = await supabase
        .from("images")
        .insert({
          owner_id: image.ownerId,
          original_url: image.originalUrl,
          url_fingerprint: image.urlFingerprint,
        })
        .select("id")
        .single();

      const insertedImage = requireData(data, error);
      return { id: insertedImage.id as string };
    },

    async listActive(ownerId, limit) {
      const { data, error } = await supabase
        .from("images")
        .select(imageColumns)
        .eq("owner_id", ownerId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);

      throwIfError(error);
      return ((data ?? []) as ImageRow[]).map(toImageRecord);
    },

    async update(ownerId, imageId, changes) {
      const updates: Record<string, string | null> = {};
      if (changes.note !== undefined) updates.note = changes.note;
      if (changes.loadStatus !== undefined) updates.load_status = changes.loadStatus;
      if (changes.deletedAt !== undefined) updates.deleted_at = changes.deletedAt;
      if (changes.lastLoadCheckedAt !== undefined) updates.last_load_checked_at = changes.lastLoadCheckedAt;

      const { data, error } = await supabase
        .from("images")
        .update(updates)
        .eq("owner_id", ownerId)
        .eq("id", imageId)
        .select(imageColumns)
        .maybeSingle();

      throwIfError(error);
      return data ? toImageRecord(data as ImageRow) : null;
    },

    async permanentlyDelete(ownerId, imageId) {
      const { data, error } = await supabase
        .from("images")
        .delete()
        .eq("owner_id", ownerId)
        .eq("id", imageId)
        .select("id")
        .maybeSingle();

      throwIfError(error);
      return data !== null;
    },
  };
}
