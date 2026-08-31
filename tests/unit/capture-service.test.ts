import { describe, expect, it } from "vitest";
import { saveCapture } from "@/features/capture";
import type { ImageCreateRepository } from "@/features/images";

describe("saveCapture", () => {
  it("preserves the submitted capture URL while delegating duplicate detection to images", async () => {
    let insertedUrl = "";
    const repository: ImageCreateRepository = {
      findActiveByFingerprint: async () => null,
      insert: async (image) => {
        insertedUrl = image.originalUrl;
        return { id: "image-1" };
      },
    };

    await expect(saveCapture(repository, "owner-1", " HTTPS://EXAMPLE.com:443/a.png ")).resolves.toEqual({
      kind: "created",
      imageId: "image-1",
    });
    expect(insertedUrl).toBe("HTTPS://EXAMPLE.com:443/a.png");
  });
});
