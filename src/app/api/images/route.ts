import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createImage } from "@/features/images";
import { parseImageUrl } from "@/lib/url";
import { createSupabaseImageRepository } from "@/server/gallery/image-repository";
import { getImagePage } from "@/server/gallery/query-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createImageSchema = z.object({
  url: z.string().min(1).max(8_192),
});

async function getAuthenticatedClient() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const loadStatus = params.get("loadStatus");
  const page = await getImagePage(supabase, user.id, {
    search: params.get("search") ?? "",
    folderId: params.get("folderId"),
    tagIds: params.getAll("tagId"),
    tagMode: params.get("tagMode") === "all" ? "all" : "any",
    inboxOnly: params.get("inboxOnly") === "true",
    loadStatus: loadStatus === "available" || loadStatus === "broken" ? loadStatus : "all",
    trashOnly: params.get("trashOnly") === "true",
  }, params.get("cursor"));
  return NextResponse.json(page);
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createImageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A valid image URL is required." }, { status: 400 });

  try {
    const result = await createImage(
      createSupabaseImageRepository(supabase),
      user.id,
      parseImageUrl(parsed.data.url),
    );
    return NextResponse.json(result, { status: result.kind === "created" ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
