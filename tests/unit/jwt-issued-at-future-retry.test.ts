import { describe, expect, it, vi } from "vitest";
import { retryOnJwtIssuedAtFuture } from "@/server/supabase/retry-issued-at-future-jwt";

describe("retryOnJwtIssuedAtFuture", () => {
  it("retries a transient JWT clock error with a bounded backoff", async () => {
    let attempts = 0;
    const wait = vi.fn().mockResolvedValue(undefined);

    const result = await retryOnJwtIssuedAtFuture(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("PGRST303: JWT issued at future");
        return "loaded";
      },
      { delays: [300, 900], wait },
    );

    expect(result).toBe("loaded");
    expect(attempts).toBe(3);
    expect(wait).toHaveBeenNthCalledWith(1, 300);
    expect(wait).toHaveBeenNthCalledWith(2, 900);
  });

  it("does not retry unrelated errors", async () => {
    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(
      retryOnJwtIssuedAtFuture(
        async () => {
          throw new Error("permission denied");
        },
        { delays: [300], wait },
      ),
    ).rejects.toThrow("permission denied");

    expect(wait).not.toHaveBeenCalled();
  });
});
