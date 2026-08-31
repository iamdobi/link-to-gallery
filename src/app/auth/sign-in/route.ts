import { NextResponse, type NextRequest } from "next/server";

import { getSafeNextPath } from "@/lib/supabase/proxy";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));
  const redirectTo = new URL("/auth/callback", request.url);
  redirectTo.searchParams.set("next", nextPath);

  const { data, error } = await (await createServerSupabaseClient()).auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo.toString() },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }

  return NextResponse.redirect(data.url);
}
