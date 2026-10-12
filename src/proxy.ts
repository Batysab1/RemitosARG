import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/dashboard")) return NextResponse.next();
  const session = request.cookies.get("better-auth.session_token") ?? request.cookies.get("__Secure-better-auth.session_token");
  if (!session) return NextResponse.redirect(new URL("/login?next=/dashboard", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
