import type { FolderTreeNode } from "@/lib/organization";

export type FolderRecord = FolderTreeNode & {
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type FolderRepository = {
  list(ownerId: string): Promise<FolderRecord[]>;
  create(ownerId: string, input: { name: string; parentId: string | null }): Promise<FolderRecord>;
  update(
    ownerId: string,
    folderId: string,
    changes: Partial<Pick<FolderRecord, "name" | "parentId" | "sortOrder">>,
  ): Promise<FolderRecord | null>;
  delete(ownerId: string, folderId: string): Promise<boolean>;
};
