import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  await (await createServerSupabaseClient()).auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
