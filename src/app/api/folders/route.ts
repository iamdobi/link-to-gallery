import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createFolder, deleteFolder, listFolders, moveFolder, renameFolder } from "@/features/folders";
import { createSupabaseFolderRepository } from "@/server/gallery/folder-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const createFolderSchema = z.object({ name: z.string().max(120), parentId: idSchema.nullable().optional() });
const updateFolderSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("rename"), folderId: idSchema, name: z.string().max(120) }),
  z.object({ action: z.literal("move"), folderId: idSchema, parentId: idSchema.nullable() }),
]);
const deleteFolderSchema = z.object({ folderId: idSchema });

async function getAuthenticatedClient() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ items: await listFolders(createSupabaseFolderRepository(supabase), user.id) });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = createFolderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid folder input." }, { status: 400 });

  try {
    const folder = await createFolder(createSupabaseFolderRepository(supabase), user.id, parsed.data);
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create folder." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = updateFolderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid folder update." }, { status: 400 });

  try {
    const repository = createSupabaseFolderRepository(supabase);
    const folder = parsed.data.action === "rename"
      ? await renameFolder(repository, user.id, parsed.data.folderId, parsed.data.name)
      : await moveFolder(repository, user.id, parsed.data.folderId, parsed.data.parentId);
    return folder ? NextResponse.json({ folder }) : NextResponse.json({ error: "Folder not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update folder." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = deleteFolderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid folder id." }, { status: 400 });

  const deleted = await deleteFolder(createSupabaseFolderRepository(supabase), user.id, parsed.data.folderId);
  return deleted ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Folder not found." }, { status: 404 });
}
