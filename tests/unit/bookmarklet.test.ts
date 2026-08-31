import { describe, expect, it } from "vitest";
import { buildBookmarklet } from "@/lib/bookmarklet";

describe("buildBookmarklet", () => {
  it("opens the capture route immediately for a direct image document", () => {
    const script = buildBookmarklet("https://gallery.example");

    expect(script).toContain('document.contentType.startsWith("image/")');
    expect(script).toContain("https://gallery.example/capture?url=");
  });

  it("keeps a visible candidate picker for ordinary web pages", () => {
    const script = buildBookmarklet("https://gallery.example");

    expect(script).toContain("document.images");
    expect(script).toContain("Save image candidate");
  });
});
