import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: authMocks.createServerSupabaseClient,
}));

import { GET } from "@/app/auth/sign-in/route";

describe("GET /auth/sign-in", () => {
  beforeEach(() => {
    authMocks.createServerSupabaseClient.mockResolvedValue({
      auth: { signInWithOAuth: authMocks.signInWithOAuth },
    });
    authMocks.signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: "https://example.supabase.co/auth/v1/authorize" },
      error: null,
    });
  });

  it("redirects to Google OAuth with the gallery callback", async () => {
    const response = await GET(
      new NextRequest("https://link-to-gallery.vercel.app/auth/sign-in?next=/gallery"),
    );

    expect(response.headers.get("location")).toBe(
      "https://example.supabase.co/auth/v1/authorize",
    );
    expect(authMocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://link-to-gallery.vercel.app/auth/callback?next=%2Fgallery",
      },
    });
  });
});
