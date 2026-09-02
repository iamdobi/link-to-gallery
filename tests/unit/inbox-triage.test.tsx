import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InboxTriage } from "@/components/gallery/inbox-triage";
import type { GalleryImage } from "@/features/gallery";

const images: GalleryImage[] = [
  {
    id: "image-1",
    originalUrl: "https://example.com/first.jpg",
    urlFingerprint: "a".repeat(64),
    note: "",
    loadStatus: "available",
    lastLoadCheckedAt: null,
    deletedAt: null,
    createdAt: "2026-09-02T00:00:00Z",
    updatedAt: "2026-09-02T00:00:00Z",
    folders: [],
    tags: [],
  },
  {
    id: "image-2",
    originalUrl: "https://example.com/second.jpg",
    urlFingerprint: "b".repeat(64),
    note: "",
    loadStatus: "available",
    lastLoadCheckedAt: null,
    deletedAt: null,
    createdAt: "2026-09-02T00:00:01Z",
    updatedAt: "2026-09-02T00:00:01Z",
    folders: [],
    tags: [],
  },
];

function json(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

const props = {
  folders: [{ id: "folder-1", name: "Reference", parentId: null, sortOrder: 0, createdAt: "2026-09-02T00:00:00Z", updatedAt: "2026-09-02T00:00:00Z" }],
  initialPage: { items: images, nextCursor: null },
  inboxCount: 2,
  onAssigned: vi.fn(),
  onClose: vi.fn(),
  onCreateTag: vi.fn(),
  tags: [],
};

describe("InboxTriage", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("moves to the next Inbox image after a successful folder assignment", async () => {
    const fetchMock = vi.fn(async () => json({ succeededIds: ["image-1"], failed: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const onAssigned = vi.fn();
    render(<InboxTriage {...props} onAssigned={onAssigned} />);

    await screen.findByText(images[0].originalUrl);
    fireEvent.click(screen.getByRole("button", { name: "Add folders" }));
    const picker = screen.getByRole("dialog", { name: "Add folders" });
    fireEvent.click(within(picker).getByRole("checkbox", { name: "Reference" }));
    fireEvent.click(within(picker).getByRole("button", { name: "Organize and continue" }));

    expect(await screen.findByText(images[1].originalUrl)).toBeVisible();
    expect(onAssigned).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/images/batch", expect.objectContaining({ method: "POST" }));
  });

  it("keeps the current image visible after a failed assignment", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ succeededIds: [], failed: [{ id: "image-1", message: "Update failed." }] })));
    render(<InboxTriage {...props} />);

    await screen.findByText(images[0].originalUrl);
    fireEvent.click(screen.getByRole("button", { name: "Add folders" }));
    const picker = screen.getByRole("dialog", { name: "Add folders" });
    fireEvent.click(within(picker).getByRole("checkbox", { name: "Reference" }));
    fireEvent.click(within(picker).getByRole("button", { name: "Organize and continue" }));

    await waitFor(() => expect(screen.getByText("Update failed.")).toBeVisible());
    expect(screen.getByText(images[0].originalUrl)).toBeVisible();
  });
});
