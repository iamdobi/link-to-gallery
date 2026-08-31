import { describe, expect, it } from "vitest";

import { getSafeNextPath } from "@/lib/supabase/proxy";

describe("getSafeNextPath", () => {
  it("keeps a local post-login path", () => {
    expect(getSafeNextPath("/gallery")).toBe("/gallery");
  });

  it("rejects an external post-login path", () => {
    expect(getSafeNextPath("https://attacker.example")).toBe("/gallery");
  });
});
