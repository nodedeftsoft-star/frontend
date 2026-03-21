import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("closr_authToken")?.value;

  if (
    !token &&
    !req.nextUrl.pathname.includes("/api") &&
    !req.nextUrl.pathname.includes("/login") &&
    !req.nextUrl.pathname.includes("/signup") &&
    !req.nextUrl.pathname.includes("/password-reset") &&
    !req.nextUrl.pathname.includes("/payment-success") &&
    !req.nextUrl.pathname.includes("/payment-cancelled")
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    token &&
    (req.nextUrl.pathname.includes("/login") ||
      req.nextUrl.pathname.includes("/signup") ||
      req.nextUrl.pathname.includes("/password-reset"))
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|webp|png|svg|ico)$).*)",
  ],
};
