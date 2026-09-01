import { NextResponse, type NextRequest } from "next/server";
import { buildBookmarkletRunner } from "@/lib/bookmarklet";

export function GET(request: NextRequest) {
  return new NextResponse(buildBookmarkletRunner(request.nextUrl.origin), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
