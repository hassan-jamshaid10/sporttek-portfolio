import { NextRequest, NextResponse } from "next/server";

const PROTECTED = [
  "/play/bookings",
  "/play/favourites",
  "/play/alerts",
  "/play/profile",
  "/play/settings",
  "/play/checkout",
  "/play/feedback",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) {
    return NextResponse.next();
  }
  const session = request.cookies.get("sporttek_player_session")?.value;
  if (!session) {
    const login = new URL("/play/login", request.url);
    // Keep query string (slot/checkout params) so login can return to the same booking.
    login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/play/:path*"],
};
