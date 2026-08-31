import type { ValidatedImageUrl } from "@/lib/url";

export type { ValidatedImageUrl } from "@/lib/url";

export type ImageLoadStatus = "unknown" | "available" | "broken";

export type ImageRecord = {
  id: string;
  originalUrl: string;
  urlFingerprint: string;
  note: string;
  loadStatus: ImageLoadStatus;
  lastLoadCheckedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ImageInsert = {
  ownerId: string;
  originalUrl: string;
  urlFingerprint: string;
};

export type ImageCreateRepository = {
  findActiveByFingerprint(ownerId: string, fingerprint: string): Promise<{ id: string } | null>;
  insert(image: ImageInsert): Promise<{ id: string }>;
};

export type ImageListRepository = {
  listActive(ownerId: string, limit: number): Promise<ImageRecord[]>;
};

export type ImageMutationRepository = {
  update(
    ownerId: string,
    imageId: string,
    changes: Partial<Pick<ImageRecord, "note" | "loadStatus" | "deletedAt" | "lastLoadCheckedAt">>,
  ): Promise<ImageRecord | null>;
  permanentlyDelete(ownerId: string, imageId: string): Promise<boolean>;
};

export type ImageRepository = ImageCreateRepository & ImageListRepository & ImageMutationRepository;

export type CreateImageResult = { kind: "created" | "duplicate"; imageId: string };

export type ImagePage = {
  items: ImageRecord[];
};

export type ImageCommand = {
  url: ValidatedImageUrl;
};
