import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GalleryToolbar } from "@/components/gallery/gallery-toolbar";

const toolbarProps = {
  counts: { active: 0, inbox: 0 },
  mode: "viewer" as const,
  onModeChange: vi.fn(),
  onOpenAddUrl: vi.fn(),
  onOpenFilters: vi.fn(),
  onOpenInboxTriage: vi.fn(),
  onSearchChange: vi.fn(),
  onViewChange: vi.fn(),
  search: "",
  view: "masonry" as const,
};

describe("GalleryToolbar", () => {
  afterEach(cleanup);

  it("opens the mobile menu and starts image addition", () => {
    const onOpenAddUrl = vi.fn();
    render(<GalleryToolbar {...toolbarProps} onOpenAddUrl={onOpenAddUrl} />);

    fireEvent.click(screen.getByRole("button", { name: "Open gallery menu" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Gallery menu" })).getByRole("button", { name: "Add image URL" }));

    expect(onOpenAddUrl).toHaveBeenCalledWith();
    expect(screen.queryByRole("dialog", { name: "Gallery menu" })).not.toBeInTheDocument();
  });

  it("posts mobile logout through the server route", () => {
    render(<GalleryToolbar {...toolbarProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Open gallery menu" }));
    const menu = screen.getByRole("dialog", { name: "Gallery menu" });
    const logoutButton = within(menu).getByRole("button", { name: "Log out" });

    expect(logoutButton.closest("form")).toHaveAttribute("action", "/auth/sign-out");
    expect(logoutButton.closest("form")).toHaveAttribute("method", "post");
  });

  it("shows active and Inbox image counts", () => {
    render(<GalleryToolbar {...toolbarProps} counts={{ active: 12, inbox: 3 }} />);

    expect(screen.getAllByText("12 images")).toHaveLength(2);
    expect(screen.getAllByText("3 Inbox")).toHaveLength(2);
  });

  it("opens Inbox triage from the mobile menu", () => {
    const onOpenInboxTriage = vi.fn();
    render(<GalleryToolbar {...toolbarProps} onOpenInboxTriage={onOpenInboxTriage} />);

    fireEvent.click(screen.getByRole("button", { name: "Open gallery menu" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Gallery menu" })).getByRole("button", { name: "Organize Inbox" }));

    expect(onOpenInboxTriage).toHaveBeenCalledOnce();
  });
});
