import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the private gallery entry point", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /link gallery/i }),
    ).toBeInTheDocument();
  });
});
