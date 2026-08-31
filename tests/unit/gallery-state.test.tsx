import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useGalleryState, type GalleryImage } from "@/features/gallery";

const image: GalleryImage = {
  id: "image-1",
  originalUrl: "https://example.com/photo.jpg",
  urlFingerprint: "a".repeat(64),
  note: "",
  loadStatus: "unknown",
  lastLoadCheckedAt: null,
  deletedAt: null,
  createdAt: "2026-08-31T00:00:00Z",
  updatedAt: "2026-08-31T00:00:00Z",
  folders: [],
  tags: [],
};

describe("useGalleryState", () => {
  it("keeps the loaded images when only the layout changes", () => {
    const { result } = renderHook(() => useGalleryState({
      initialPage: { items: [image], nextCursor: null },
    }));

    act(() => result.current.setFilters({ view: "square" }));

    expect(result.current.filters.view).toBe("square");
    expect(result.current.items).toEqual([image]);
  });
});
