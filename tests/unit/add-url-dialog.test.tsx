import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddUrlDialog } from "@/components/gallery/add-url-dialog";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("AddUrlDialog", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("imports nonblank URL lines and reports every outcome", async () => {
    const onSaved = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ kind: "created", imageId: "image-1" }, 201))
      .mockResolvedValueOnce(json({ kind: "duplicate", imageId: "image-2" }));
    vi.stubGlobal("fetch", fetchMock);
    render(<AddUrlDialog onClose={vi.fn()} onSaved={onSaved} open />);

    fireEvent.click(screen.getByRole("button", { name: "Bulk add URLs" }));
    fireEvent.change(screen.getByLabelText("Image URLs"), {
      target: { value: "https://images.example/one.jpg\n\nhttps://images.example/two.jpg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add 2 URLs" }));

    expect(await screen.findByText("Added: https://images.example/one.jpg")).toBeVisible();
    expect(screen.getByText("Already saved: https://images.example/two.jpg")).toBeVisible();
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/images", expect.objectContaining({
      body: JSON.stringify({ url: "https://images.example/one.jpg" }),
      method: "POST",
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/images", expect.objectContaining({
      body: JSON.stringify({ url: "https://images.example/two.jpg" }),
      method: "POST",
    }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  });
});
