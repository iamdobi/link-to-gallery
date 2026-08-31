import type { SupabaseClient } from "@supabase/supabase-js";
import type { TagRecord, TagRepository } from "@/features/tags";

const tagColumns = "id, name, name_normalized, created_at, updated_at";

type TagRow = {
  id: string;
  name: string;
  name_normalized: string;
  created_at: string;
  updated_at: string;
};

function toTagRecord(row: TagRow): TagRecord {
  return {
    id: row.id,
    name: row.name,
    normalizedName: row.name_normalized,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSupabaseTagRepository(supabase: SupabaseClient): TagRepository {
  return {
    async list(ownerId) {
      const { data, error } = await supabase
        .from("tags")
        .select(tagColumns)
        .eq("owner_id", ownerId)
        .order("name_normalized", { ascending: true });

      if (error) throw new Error(error.message);
      return ((data ?? []) as TagRow[]).map(toTagRecord);
    },

    async findByNormalizedName(ownerId, normalizedName) {
      const { data, error } = await supabase
        .from("tags")
        .select(tagColumns)
        .eq("owner_id", ownerId)
        .eq("name_normalized", normalizedName)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data ? toTagRecord(data as TagRow) : null;
    },

    async create(ownerId, input) {
      const { data, error } = await supabase
        .from("tags")
        .insert({ owner_id: ownerId, name: input.name, name_normalized: input.normalizedName })
        .select(tagColumns)
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("The tag operation returned no data.");
      return toTagRecord(data as TagRow);
    },

    async rename(ownerId, tagId, input) {
      const { data, error } = await supabase
        .from("tags")
        .update({ name: input.name, name_normalized: input.normalizedName })
        .eq("owner_id", ownerId)
        .eq("id", tagId)
        .select(tagColumns)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data ? toTagRecord(data as TagRow) : null;
    },

    async merge(ownerId, sourceTagId, targetTagId) {
      const { data: source, error: sourceError } = await supabase
        .from("tags")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("id", sourceTagId)
        .maybeSingle();
      if (sourceError) throw new Error(sourceError.message);
      if (!source) return false;

      const { data: target, error: targetError } = await supabase
        .from("tags")
        .select("id")
        .eq("owner_id", ownerId)
        .eq("id", targetTagId)
        .maybeSingle();
      if (targetError) throw new Error(targetError.message);
      if (!target) return false;

      const { data: links, error: linksError } = await supabase
        .from("image_tags")
        .select("image_id")
        .eq("tag_id", sourceTagId);
      if (linksError) throw new Error(linksError.message);

      if (links?.length) {
        const { error: upsertError } = await supabase
          .from("image_tags")
          .upsert(links.map((link) => ({ image_id: link.image_id, tag_id: targetTagId })), {
            onConflict: "image_id,tag_id",
            ignoreDuplicates: true,
          });
        if (upsertError) throw new Error(upsertError.message);
      }

      const { error: deleteError } = await supabase
        .from("tags")
        .delete()
        .eq("owner_id", ownerId)
        .eq("id", sourceTagId);
      if (deleteError) throw new Error(deleteError.message);
      return true;
    },

    async delete(ownerId, tagId) {
      const { data, error } = await supabase
        .from("tags")
        .delete()
        .eq("owner_id", ownerId)
        .eq("id", tagId)
        .select("id")
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data !== null;
    },
  };
}
