import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

describe("GoogleSignInButton", () => {
  it("uses a server-side sign-in route so authentication can start without client JavaScript", () => {
    render(<GoogleSignInButton nextPath="/gallery" />);

    expect(
      screen.getByRole("link", { name: /continue with google/i }),
    ).toHaveAttribute("href", "/auth/sign-in?next=%2Fgallery");
  });
});
