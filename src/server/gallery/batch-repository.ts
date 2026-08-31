import type { SupabaseClient } from "@supabase/supabase-js";

export type BatchAction = "folder_add" | "folder_remove" | "tag_add" | "tag_remove" | "trash" | "restore" | "permanent_delete";

export type BatchOperationInput = {
  action: BatchAction;
  imageIds: string[];
  targetIds?: string[];
};

export type BatchResult = {
  succeededIds: string[];
  failed: Array<{ id: string; message: string }>;
};

export type BatchRepository = {
  validateTargets(ownerId: string, action: BatchAction, targetIds: string[]): Promise<void>;
  applyToImage(ownerId: string, imageId: string, input: BatchOperationInput): Promise<void>;
};

function requiresTargets(action: BatchAction): boolean {
  return action === "folder_add" || action === "folder_remove" || action === "tag_add" || action === "tag_remove";
}

export async function applyBatchOperation(
  repository: BatchRepository,
  ownerId: string,
  input: BatchOperationInput,
): Promise<BatchResult> {
  const imageIds = [...new Set(input.imageIds)];
  const targetIds = [...new Set(input.targetIds ?? [])];
  if (imageIds.length === 0) throw new Error("At least one image is required.");
  if (requiresTargets(input.action) && targetIds.length === 0) throw new Error("At least one folder or tag is required.");

  if (targetIds.length) await repository.validateTargets(ownerId, input.action, targetIds);

  const result: BatchResult = { succeededIds: [], failed: [] };
  for (const imageId of imageIds) {
    try {
      await repository.applyToImage(ownerId, imageId, { ...input, imageIds: [imageId], targetIds });
      result.succeededIds.push(imageId);
    } catch (error) {
      result.failed.push({
        id: imageId,
        message: error instanceof Error ? error.message : "Unable to update image.",
      });
    }
  }

  return result;
}

async function assertImageOwnership(supabase: SupabaseClient, ownerId: string, imageId: string): Promise<void> {
  const { data, error } = await supabase
    .from("images")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("id", imageId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Image not found.");
}

async function assertTargetOwnership(
  supabase: SupabaseClient,
  ownerId: string,
  table: "folders" | "tags",
  targetIds: string[],
): Promise<void> {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("owner_id", ownerId)
    .in("id", targetIds);
  if (error) throw new Error(error.message);
  if ((data?.length ?? 0) !== targetIds.length) throw new Error("A selected folder or tag was not found.");
}

export function createSupabaseBatchRepository(supabase: SupabaseClient): BatchRepository {
  return {
    async validateTargets(ownerId, action, targetIds) {
      if (action === "folder_add" || action === "folder_remove") {
        await assertTargetOwnership(supabase, ownerId, "folders", targetIds);
      }
      if (action === "tag_add" || action === "tag_remove") {
        await assertTargetOwnership(supabase, ownerId, "tags", targetIds);
      }
    },

    async applyToImage(ownerId, imageId, input) {
      await assertImageOwnership(supabase, ownerId, imageId);
      const targetIds = input.targetIds ?? [];

      if (input.action === "folder_add") {
        const { error } = await supabase
          .from("image_folders")
          .upsert(targetIds.map((folderId) => ({ image_id: imageId, folder_id: folderId })), {
            onConflict: "image_id,folder_id",
            ignoreDuplicates: true,
          });
        if (error) throw new Error(error.message);
        return;
      }

      if (input.action === "folder_remove") {
        const { error } = await supabase
          .from("image_folders")
          .delete()
          .eq("image_id", imageId)
          .in("folder_id", targetIds);
        if (error) throw new Error(error.message);
        return;
      }

      if (input.action === "tag_add") {
        const { error } = await supabase
          .from("image_tags")
          .upsert(targetIds.map((tagId) => ({ image_id: imageId, tag_id: tagId })), {
            onConflict: "image_id,tag_id",
            ignoreDuplicates: true,
          });
        if (error) throw new Error(error.message);
        return;
      }

      if (input.action === "tag_remove") {
        const { error } = await supabase
          .from("image_tags")
          .delete()
          .eq("image_id", imageId)
          .in("tag_id", targetIds);
        if (error) throw new Error(error.message);
        return;
      }

      if (input.action === "permanent_delete") {
        const { error } = await supabase
          .from("images")
          .delete()
          .eq("owner_id", ownerId)
          .eq("id", imageId);
        if (error) throw new Error(error.message);
        return;
      }

      const { error } = await supabase
        .from("images")
        .update({ deleted_at: input.action === "trash" ? new Date().toISOString() : null })
        .eq("owner_id", ownerId)
        .eq("id", imageId);
      if (error) throw new Error(error.message);
    },
  };
}
