import { describe, expect, it } from "vitest";
import { distributeMasonryItems } from "@/features/gallery/masonry-layout";

describe("distributeMasonryItems", () => {
  it("keeps existing images in their columns when more images are appended", () => {
    const initial = distributeMasonryItems(["one", "two", "three", "four", "five", "six"], 3);
    const expanded = distributeMasonryItems(["one", "two", "three", "four", "five", "six", "seven", "eight"], 3);

    expect(initial).toEqual([
      ["one", "four"],
      ["two", "five"],
      ["three", "six"],
    ]);
    expect(expanded.map((column, index) => column.slice(0, initial[index].length))).toEqual(initial);
  });
});
