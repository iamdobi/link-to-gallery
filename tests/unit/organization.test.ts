import { describe, expect, it } from "vitest";
import { createTag, type TagRepository } from "@/features/tags";
import { normalizeTagName, validateFolderMove } from "@/lib/organization";
import { applyBatchOperation, type BatchRepository } from "@/server/gallery/batch-repository";

describe("normalizeTagName", () => {
  it("keeps the trimmed display name and creates a case-insensitive key", () => {
    expect(normalizeTagName("  INTERIOR  ")).toEqual({
      displayName: "INTERIOR",
      normalizedName: "interior",
    });
  });
});

describe("createTag", () => {
  it("stores the display name with its normalized uniqueness key", async () => {
    let inserted: { name: string; normalizedName: string } | undefined;
    const repository: TagRepository = {
      list: async () => [],
      findByNormalizedName: async () => null,
      create: async (_ownerId, value) => {
        inserted = value;
        return { id: "tag-1", ...value, createdAt: "2026-08-31T00:00:00Z", updatedAt: "2026-08-31T00:00:00Z" };
      },
      rename: async () => null,
      merge: async () => false,
      delete: async () => false,
    };

    await createTag(repository, "owner-1", "  INTERIOR  ");

    expect(inserted).toEqual({ name: "INTERIOR", normalizedName: "interior" });
  });
});

describe("validateFolderMove", () => {
  it("rejects moving a folder below one of its descendants", () => {
    const tree = [
      { id: "root", parentId: null },
      { id: "child", parentId: "root" },
      { id: "grandchild", parentId: "child" },
    ];

    expect(() => validateFolderMove(tree, "root", "child")).toThrow(/descendant/i);
  });

  it("permits moving a folder to a separate branch", () => {
    const tree = [
      { id: "root", parentId: null },
      { id: "child", parentId: "root" },
      { id: "other", parentId: null },
    ];

    expect(() => validateFolderMove(tree, "child", "other")).not.toThrow();
  });
});

describe("applyBatchOperation", () => {
  it("rejects a batch operation with no selected images", async () => {
    const repository: BatchRepository = {
      validateTargets: async () => undefined,
      applyToImage: async () => undefined,
    };

    await expect(applyBatchOperation(repository, "owner-1", { action: "trash", imageIds: [] }))
      .rejects.toThrow(/image/i);
  });
});
