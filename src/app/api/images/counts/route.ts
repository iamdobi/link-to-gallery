import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGalleryCounts } from "@/server/gallery/query-repository";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    return NextResponse.json(await getGalleryCounts(supabase, user.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load image counts." }, { status: 400 });
  }
}
