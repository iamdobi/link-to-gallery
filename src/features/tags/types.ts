export type TagRecord = {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: string;
  updatedAt: string;
};

export type TagRepository = {
  list(ownerId: string): Promise<TagRecord[]>;
  findByNormalizedName(ownerId: string, normalizedName: string): Promise<TagRecord | null>;
  create(ownerId: string, input: { name: string; normalizedName: string }): Promise<TagRecord>;
  rename(ownerId: string, tagId: string, input: { name: string; normalizedName: string }): Promise<TagRecord | null>;
  merge(ownerId: string, sourceTagId: string, targetTagId: string): Promise<boolean>;
  delete(ownerId: string, tagId: string): Promise<boolean>;
};

export type CreateTagResult = { kind: "created" | "duplicate"; tag: TagRecord };
