import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImageTile } from "@/components/gallery/image-tile";
import type { GalleryImage } from "@/features/gallery";

const image: GalleryImage = {
  id: "image-1",
  originalUrl: "https://example.com/photo.jpg",
  urlFingerprint: "a".repeat(64),
  note: "Reference image",
  loadStatus: "unknown",
  lastLoadCheckedAt: null,
  deletedAt: null,
  createdAt: "2026-08-31T00:00:00Z",
  updatedAt: "2026-08-31T00:00:00Z",
  folders: [],
  tags: [],
};

describe("ImageTile", () => {
  it("reports a broken source image", () => {
    const reported: Array<{ id: string; status: string }> = [];
    const onLoadStatus = (id: string, status: string) => reported.push({ id, status });
    render(<ImageTile image={image} mode="viewer" onLoadStatus={onLoadStatus} />);

    fireEvent.error(screen.getByRole("img"));

    expect(reported).toEqual([{ id: image.id, status: "broken" }]);
    expect(screen.getByText(/image unavailable/i)).toBeInTheDocument();
  });
});
