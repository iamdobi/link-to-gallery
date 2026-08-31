import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookmarkletInstall } from "@/components/gallery/bookmarklet-install";

describe("BookmarkletInstall", () => {
  afterEach(cleanup);

  it("copies a capture bookmarklet for the current gallery origin", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<BookmarkletInstall />);

    const input = await screen.findByLabelText("Bookmarklet code");
    expect((input as HTMLInputElement).value).toContain(`${window.location.origin}/capture?url=`);

    fireEvent.click(screen.getByRole("button", { name: "Copy bookmarklet" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith((input as HTMLInputElement).value));
  });

  it("keeps a manual copy fallback visible when Clipboard access is denied", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) } });
    render(<BookmarkletInstall />);

    await screen.findByLabelText("Bookmarklet code");
    fireEvent.click(screen.getByRole("button", { name: "Copy bookmarklet" }));

    await expect(screen.findByText("Copy the code manually.")).resolves.toBeVisible();
  });
});
