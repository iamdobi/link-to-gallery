import { describe, expect, it } from "vitest";
import { parseImageUrl } from "@/lib/url";

describe("parseImageUrl", () => {
  it("preserves the submitted URL while fingerprinting a normalized URL", () => {
    const value = parseImageUrl(" HTTPS://EXAMPLE.com:443/a.png?x=1 ");
    expect(value.originalUrl).toBe("HTTPS://EXAMPLE.com:443/a.png?x=1");
    expect(value.normalizedUrl).toBe("https://example.com/a.png?x=1");
    expect(value.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });
  it("rejects non-http URLs", () => {
    expect(() => parseImageUrl("file:///secret.png")).toThrow(/http/i);
  });
});
