import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("closr_authToken")?.value;

  // Public routes that don't require authentication
  const publicRoutes = ["/api", "/login", "/signup", "/password-reset", "/payment-success", "/payment-cancelled", "/pricing"];

  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.includes(route));

  // Redirect to login if no token and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user has token and is trying to access auth routes, redirect to dashboard
  if (token && (req.nextUrl.pathname.includes("/login") || req.nextUrl.pathname.includes("/signup") || req.nextUrl.pathname.includes("/password-reset"))) {
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
