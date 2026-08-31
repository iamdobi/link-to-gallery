import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { applyBatchOperation, createSupabaseBatchRepository } from "@/server/gallery/batch-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const batchOperationSchema = z.object({
  action: z.enum(["folder_add", "folder_remove", "tag_add", "tag_remove", "trash", "restore"]),
  imageIds: z.array(z.string().uuid()).min(1).max(100),
  targetIds: z.array(z.string().uuid()).max(50).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsed = batchOperationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid batch operation." }, { status: 400 });

  try {
    const result = await applyBatchOperation(createSupabaseBatchRepository(supabase), user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update images." }, { status: 400 });
  }
}
