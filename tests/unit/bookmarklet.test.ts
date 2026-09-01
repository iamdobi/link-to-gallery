import { afterEach, describe, expect, it } from "vitest";
import {
  buildBookmarklet,
  buildCompactBookmarklet,
  getBookmarkletForBrowser,
} from "@/lib/bookmarklet";

afterEach(() => {
  document.head.querySelectorAll("script[data-link-gallery-bookmarklet]").forEach((script) => script.remove());
});

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

  it("loads the image picker with a compact mobile bookmarklet", () => {
    const script = buildCompactBookmarklet("https://gallery.example");
    Function(script.slice("javascript:".length))();

    const loader = document.head.querySelector<HTMLScriptElement>("script[data-link-gallery-bookmarklet]");
    expect(loader?.src).toBe("https://gallery.example/bookmarklet.js");
    expect(script.length).toBeLessThan(400);
  });

  it("selects the compact loader for iPhone and iPad browsers", () => {
    expect(
      getBookmarkletForBrowser(
        "https://gallery.example",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      ),
    ).toContain("/bookmarklet.js");
    expect(
      getBookmarkletForBrowser(
        "https://gallery.example",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        5,
      ),
    ).toContain("/bookmarklet.js");
  });

  it("keeps the inline bookmarklet for desktop browsers", () => {
    expect(
      getBookmarkletForBrowser(
        "https://gallery.example",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
      ),
    ).toContain("document.images");
  });
});
