import { describe, expect, it, vi } from "vitest";
import { buildImageFilter, getGalleryCounts } from "@/server/gallery/query-repository";

function createCountQuery(count: number) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    then: (resolve: (value: { count: number; error: null }) => unknown) => Promise.resolve({ count, error: null }).then(resolve),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  return query;
}

describe("buildImageFilter", () => {
  it("describes Inbox as images with no folder and no tag", () => {
    expect(buildImageFilter({ inboxOnly: true })).toContain("no folder and no tag");
  });

  it("describes match-all tag filtering as requiring both tags", () => {
    expect(buildImageFilter({ tagIds: ["a", "b"], tagMode: "all" })).toContain("both tags");
  });

  it("counts active and Inbox images separately", async () => {
    const activeQuery = createCountQuery(7);
    const inboxQuery = createCountQuery(2);
    const supabase = { from: vi.fn().mockReturnValueOnce(activeQuery).mockReturnValueOnce(inboxQuery) };

    await expect(getGalleryCounts(supabase as never, "owner-1")).resolves.toEqual({ active: 7, inbox: 2 });
    expect(activeQuery.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(inboxQuery.select).toHaveBeenCalledWith(
      "id,image_folders!left(image_id),image_tags!left(image_id)",
      { count: "exact", head: true },
    );
    expect(inboxQuery.is).toHaveBeenCalledWith("image_folders.image_id", null);
    expect(inboxQuery.is).toHaveBeenCalledWith("image_tags.image_id", null);
  });
});
