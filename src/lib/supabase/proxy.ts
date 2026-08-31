export function getSafeNextPath(nextPath: string | null): string {
  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }

  return "/gallery";
}

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data } = await supabase.auth.getClaims();
  const protectedPath = ["/gallery", "/capture", "/api/"].some((path) => request.nextUrl.pathname.startsWith(path));
  if (protectedPath && !data?.claims) { const url = request.nextUrl.clone(); url.pathname = "/login"; url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search); return NextResponse.redirect(url); }
  return response;
}
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
