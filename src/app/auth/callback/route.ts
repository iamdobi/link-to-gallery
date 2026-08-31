import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath } from "@/lib/supabase/proxy";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));
  if (code) { const { error } = await (await createServerSupabaseClient()).auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(new URL(nextPath, request.url)); }
  return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
}
