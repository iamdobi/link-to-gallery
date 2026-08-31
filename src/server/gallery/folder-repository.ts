import type { SupabaseClient } from "@supabase/supabase-js";
import type { FolderRecord, FolderRepository } from "@/features/folders";

const folderColumns = "id, name, parent_id, sort_order, created_at, updated_at";

type FolderRow = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function toFolderRecord(row: FolderRow): FolderRecord {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("The folder operation returned no data.");
  return data;
}

export function createSupabaseFolderRepository(supabase: SupabaseClient): FolderRepository {
  return {
    async list(ownerId) {
      const { data, error } = await supabase
        .from("folders")
        .select(folderColumns)
        .eq("owner_id", ownerId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return ((data ?? []) as FolderRow[]).map(toFolderRecord);
    },

    async create(ownerId, input) {
      const { data, error } = await supabase
        .from("folders")
        .insert({ owner_id: ownerId, name: input.name, parent_id: input.parentId })
        .select(folderColumns)
        .single();

      return toFolderRecord(requireData(data as FolderRow | null, error));
    },

    async update(ownerId, folderId, changes) {
      const updates: Record<string, string | number | null> = {};
      if (changes.name !== undefined) updates.name = changes.name;
      if (changes.parentId !== undefined) updates.parent_id = changes.parentId;
      if (changes.sortOrder !== undefined) updates.sort_order = changes.sortOrder;

      const { data, error } = await supabase
        .from("folders")
        .update(updates)
        .eq("owner_id", ownerId)
        .eq("id", folderId)
        .select(folderColumns)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data ? toFolderRecord(data as FolderRow) : null;
    },

    async delete(ownerId, folderId) {
      const { data, error } = await supabase
        .from("folders")
        .delete()
        .eq("owner_id", ownerId)
        .eq("id", folderId)
        .select("id")
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data !== null;
    },
  };
}
