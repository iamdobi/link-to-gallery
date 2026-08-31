import type {
  CreateImageResult,
  ImageCreateRepository,
  ImageLoadStatus,
  ImageListRepository,
  ImageMutationRepository,
  ImagePage,
  ValidatedImageUrl,
} from "./types";

export async function createImage(
  repository: ImageCreateRepository,
  ownerId: string,
  url: ValidatedImageUrl,
): Promise<CreateImageResult> {
  const existing = await repository.findActiveByFingerprint(ownerId, url.fingerprint);

  if (existing) {
    return { kind: "duplicate", imageId: existing.id };
  }

  const image = await repository.insert({
    ownerId,
    originalUrl: url.originalUrl,
    urlFingerprint: url.fingerprint,
  });

  return { kind: "created", imageId: image.id };
}

export async function listImages(
  repository: ImageListRepository,
  ownerId: string,
  limit = 48,
): Promise<ImagePage> {
  return { items: await repository.listActive(ownerId, limit) };
}

export async function setImageLoadStatus(
  repository: ImageMutationRepository,
  ownerId: string,
  imageId: string,
  loadStatus: ImageLoadStatus,
) {
  return repository.update(ownerId, imageId, {
    loadStatus,
    lastLoadCheckedAt: new Date().toISOString(),
  });
}

export async function setImageNote(
  repository: ImageMutationRepository,
  ownerId: string,
  imageId: string,
  note: string,
) {
  return repository.update(ownerId, imageId, { note });
}

export async function setImageTrashState(
  repository: ImageMutationRepository,
  ownerId: string,
  imageId: string,
  trashed: boolean,
) {
  return repository.update(ownerId, imageId, { deletedAt: trashed ? new Date().toISOString() : null });
}

export async function permanentlyDeleteImage(
  repository: ImageMutationRepository,
  ownerId: string,
  imageId: string,
) {
  return repository.permanentlyDelete(ownerId, imageId);
}
