import { describe, expect, it } from "vitest";
import { classifyGesture } from "@/lib/gesture";

describe("classifyGesture", () => {
  it("dismisses a substantial downward swipe", () => {
    expect(classifyGesture(12, 140)).toBe("dismiss");
  });

  it("moves to the next image for a left swipe", () => {
    expect(classifyGesture(-140, 15)).toBe("next");
  });

  it("ignores small diagonal movement", () => {
    expect(classifyGesture(20, 20)).toBe("none");
  });
});
