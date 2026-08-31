import { describe, expect, it } from "vitest";
import { buildImageFilter } from "@/server/gallery/query-repository";

describe("buildImageFilter", () => {
  it("describes Inbox as images with no folder and no tag", () => {
    expect(buildImageFilter({ inboxOnly: true })).toContain("no folder and no tag");
  });

  it("describes match-all tag filtering as requiring both tags", () => {
    expect(buildImageFilter({ tagIds: ["a", "b"], tagMode: "all" })).toContain("both tags");
  });
});
