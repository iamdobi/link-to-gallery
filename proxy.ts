import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";
export const proxy = (request: NextRequest) => updateSupabaseSession(request);
export const config = { matcher: ["/gallery/:path*", "/capture/:path*", "/api/:path*"] };
