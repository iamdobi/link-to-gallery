import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  {
    id: "image-3",
    originalUrl: "https://example.com/three.jpg",
    urlFingerprint: "c".repeat(64),
    note: "Third",
    loadStatus: "available",
    lastLoadCheckedAt: null,
    deletedAt: null,
    createdAt: "2026-08-31T00:00:02Z",
    updatedAt: "2026-08-31T00:00:02Z",
    folders: [],
    tags: [],
  },
];

describe("FullscreenViewer", () => {
  afterEach(cleanup);

  it("dismisses after a downward swipe", () => {
    let dismissed = 0;
    render(<FullscreenViewer imageId="image-1" images={images} onDismiss={() => { dismissed += 1; }} onNavigate={() => undefined} />);

    const dialog = screen.getByRole("dialog");
    fireEvent.pointerDown(dialog, { clientX: 20, clientY: 20 });
    fireEvent.pointerUp(dialog, { clientX: 32, clientY: 160 });

    expect(dismissed).toBe(1);
  });

  it("uses dark overlay controls without the default white button surface", () => {
    render(<FullscreenViewer imageId="image-2" images={images} onDismiss={() => undefined} onNavigate={() => undefined} />);

    for (const control of [
      screen.getByRole("button", { name: "Close full screen viewer" }),
      screen.getByRole("button", { name: "Previous image" }),
      screen.getByRole("button", { name: "Next image" }),
    ]) {
      expect(control.className).toContain("bg-slate-900");
      expect(control.className).not.toContain("bg-white");
      expect(control.className).toContain("text-white");
    }
  });

  it("navigates when the left or right third of the viewer is tapped", () => {
    const onNavigate = vi.fn();
    const { rerender } = render(<FullscreenViewer imageId="image-2" images={images} onDismiss={() => undefined} onNavigate={onNavigate} />);
    const dialog = screen.getByRole("dialog");
    Object.defineProperty(dialog, "clientWidth", { configurable: true, value: 300 });

    fireEvent.pointerDown(dialog, { clientX: 40, clientY: 280 });
    fireEvent.pointerUp(dialog, { clientX: 40, clientY: 280 });
    expect(onNavigate).toHaveBeenLastCalledWith("image-1");

    rerender(<FullscreenViewer imageId="image-1" images={images} onDismiss={() => undefined} onNavigate={onNavigate} />);
    fireEvent.pointerDown(dialog, { clientX: 260, clientY: 280 });
    fireEvent.pointerUp(dialog, { clientX: 260, clientY: 280 });
    expect(onNavigate).toHaveBeenLastCalledWith("image-2");
  });
});
