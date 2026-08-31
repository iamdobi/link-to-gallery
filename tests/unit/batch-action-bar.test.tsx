import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BatchActionBar } from "@/components/gallery/batch-action-bar";

describe("BatchActionBar", () => {
  it("keeps failed ids selected after a batch mutation", async () => {
    let nextSelection: Set<string> | undefined;
    render(
      <BatchActionBar
        apply={async () => ({ succeededIds: ["a"], failed: [{ id: "b", message: "Image not found." }] })}
        onConfirmPermanentDelete={() => undefined}
        onConfirmTrash={() => undefined}
        onOpenFolders={() => undefined}
        onOpenTags={() => undefined}
        onRemoveFolders={() => undefined}
        onRemoveTags={() => undefined}
        onSelectionChange={(ids) => { nextSelection = ids; }}
        selectedIds={new Set(["a", "b"])}
        trashOnly
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /restore selected images/i }));

    await waitFor(() => expect([...nextSelection ?? []]).toEqual(["b"]));
  });
});
