import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createTag, deleteTag, listTags, mergeTags, renameTag } from "@/features/tags";
import { createSupabaseTagRepository } from "@/server/gallery/tag-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const createTagSchema = z.object({ name: z.string().max(120) });
const updateTagSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("rename"), tagId: idSchema, name: z.string().max(120) }),
  z.object({ action: z.literal("merge"), sourceTagId: idSchema, targetTagId: idSchema }),
]);
const deleteTagSchema = z.object({ tagId: idSchema });

async function getAuthenticatedClient() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ items: await listTags(createSupabaseTagRepository(supabase), user.id) });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = createTagSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid tag input." }, { status: 400 });

  try {
    const result = await createTag(createSupabaseTagRepository(supabase), user.id, parsed.data.name);
    return NextResponse.json(result, { status: result.kind === "created" ? 201 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create tag." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = updateTagSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid tag update." }, { status: 400 });

  try {
    const repository = createSupabaseTagRepository(supabase);
    if (parsed.data.action === "merge") {
      const merged = await mergeTags(repository, user.id, parsed.data.sourceTagId, parsed.data.targetTagId);
      return merged ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Tag not found." }, { status: 404 });
    }

    const tag = await renameTag(repository, user.id, parsed.data.tagId, parsed.data.name);
    return tag ? NextResponse.json({ tag }) : NextResponse.json({ error: "Tag not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update tag." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = deleteTagSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid tag id." }, { status: 400 });

  const deleted = await deleteTag(createSupabaseTagRepository(supabase), user.id, parsed.data.tagId);
  return deleted ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Tag not found." }, { status: 404 });
}
