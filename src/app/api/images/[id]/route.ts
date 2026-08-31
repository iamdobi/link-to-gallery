import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  permanentlyDeleteImage,
  setImageLoadStatus,
  setImageNote,
  setImageTrashState,
} from "@/features/images";
import { createSupabaseImageRepository } from "@/server/gallery/image-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const imageIdSchema = z.string().uuid();
const updateSchema = z.object({
  loadStatus: z.enum(["available", "broken"]).optional(),
  note: z.string().max(4_000).optional(),
  action: z.enum(["trash", "restore", "permanent_delete"]).optional(),
}).refine((value) => value.loadStatus !== undefined || value.note !== undefined || value.action !== undefined, {
  message: "An image update is required.",
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/images/[id]">,
) {
  const { id } = await params;
  if (!imageIdSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid image id." }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid image update." }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const repository = createSupabaseImageRepository(supabase);
  const { action, loadStatus, note } = parsed.data;
  if (action === "permanent_delete") {
    const deleted = await permanentlyDeleteImage(repository, user.id, id);
    return deleted ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  let image = action === "trash"
    ? await setImageTrashState(repository, user.id, id, true)
    : action === "restore"
      ? await setImageTrashState(repository, user.id, id, false)
      : null;

  if (loadStatus) image = await setImageLoadStatus(repository, user.id, id, loadStatus);
  if (note !== undefined) image = await setImageNote(repository, user.id, id, note);

  return image ? NextResponse.json({ image }) : NextResponse.json({ error: "Image not found." }, { status: 404 });
}
