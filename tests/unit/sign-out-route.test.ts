import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: authMocks.createServerSupabaseClient,
}));

import { POST } from "@/app/auth/sign-out/route";

describe("POST /auth/sign-out", () => {
  beforeEach(() => {
    authMocks.createServerSupabaseClient.mockResolvedValue({
      auth: { signOut: authMocks.signOut },
    });
    authMocks.signOut.mockResolvedValue({ error: null });
  });

  it("clears the session and redirects to login", async () => {
    const response = await POST(
      new NextRequest("https://link-to-gallery.vercel.app/auth/sign-out", { method: "POST" }),
    );

    expect(authMocks.signOut).toHaveBeenCalledWith();
    expect(response.headers.get("location")).toBe("https://link-to-gallery.vercel.app/login");
  });
});
