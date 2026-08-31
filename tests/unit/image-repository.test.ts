import { describe, expect, it } from "vitest";
import { createImage, type ImageCreateRepository } from "@/features/images";
import { parseImageUrl } from "@/lib/url";

describe("createImage", () => {
  it("returns the existing image id when the fingerprint already exists", async () => {
    const repository: ImageCreateRepository = {
      findActiveByFingerprint: async () => ({ id: "image-1" }),
      insert: async () => ({ id: "new-image" }),
    };

    const result = await createImage(
      repository,
      "owner-1",
      parseImageUrl("https://example.com/image.png"),
    );

    expect(result).toEqual({ kind: "duplicate", imageId: "image-1" });
  });

  it("stores the submitted URL with its normalized fingerprint", async () => {
    let inserted: Record<string, string> | undefined;
    const repository: ImageCreateRepository = {
      findActiveByFingerprint: async () => null,
      insert: async (image) => {
        inserted = image;
        return { id: "image-2" };
      },
    };

    const result = await createImage(
      repository,
      "owner-1",
      parseImageUrl("HTTPS://EXAMPLE.com:443/image.png"),
    );

    expect(result).toEqual({ kind: "created", imageId: "image-2" });
    expect(inserted).toEqual({
      ownerId: "owner-1",
      originalUrl: "HTTPS://EXAMPLE.com:443/image.png",
      urlFingerprint: "99a19c215d3db74ae82c36fa43878f88c5e63830dc30799320b01a4f5aa341e4",
    });
  });
});
