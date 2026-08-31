import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FullscreenViewer } from "@/components/gallery/fullscreen-viewer";
import type { GalleryImage } from "@/features/gallery";

const images: GalleryImage[] = [
  {
    id: "image-1",
    originalUrl: "https://example.com/one.jpg",
    urlFingerprint: "a".repeat(64),
    note: "First",
    loadStatus: "available",
    lastLoadCheckedAt: null,
    deletedAt: null,
    createdAt: "2026-08-31T00:00:00Z",
    updatedAt: "2026-08-31T00:00:00Z",
    folders: [],
    tags: [],
  },
  {
    id: "image-2",
    originalUrl: "https://example.com/two.jpg",
    urlFingerprint: "b".repeat(64),
    note: "Second",
    loadStatus: "available",
    lastLoadCheckedAt: null,
    deletedAt: null,
    createdAt: "2026-08-31T00:00:01Z",
    updatedAt: "2026-08-31T00:00:01Z",
    folders: [],
    tags: [],
  },
];

describe("FullscreenViewer", () => {
  it("dismisses after a downward swipe", () => {
    let dismissed = 0;
    render(<FullscreenViewer imageId="image-1" images={images} onDismiss={() => { dismissed += 1; }} onNavigate={() => undefined} />);

    const dialog = screen.getByRole("dialog");
    fireEvent.pointerDown(dialog, { clientX: 20, clientY: 20 });
    fireEvent.pointerUp(dialog, { clientX: 32, clientY: 160 });

    expect(dismissed).toBe(1);
  });
});
