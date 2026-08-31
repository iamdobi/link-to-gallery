import { createImage, type CreateImageResult } from "@/features/images";
import { parseImageUrl } from "@/lib/url";
import type { CaptureRepository } from "./types";

export function getCapturePreviewUrl(url: string): string {
  return parseImageUrl(url).originalUrl;
}

export async function saveCapture(
  repository: CaptureRepository,
  ownerId: string,
  url: string,
): Promise<CreateImageResult> {
  return createImage(repository, ownerId, parseImageUrl(url));
}
