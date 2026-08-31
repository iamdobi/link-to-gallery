import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it("explains an access denial after an unsuccessful Google sign-in", async () => {
    render(
      await LoginPage({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({ error: "access_denied" }),
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /this Google account is not approved for the gallery/i,
    );
  });
});
