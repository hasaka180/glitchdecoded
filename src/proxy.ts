import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/appwrite/config";

/**
 * Optimistic route gating. Renamed from Middleware in Next 16; same job.
 *
 * This only looks for the presence of a session cookie — it never validates it.
 * Proxy runs on every request including prefetches, so a round trip to Appwrite
 * here would tax every navigation on the site. The real check happens in
 * `lib/auth/dal.ts`, next to the data. This exists to spare signed-out readers
 * a flash of the dashboard shell before that redirect lands.
 */
const PROTECTED = ["/dashboard"];
const AUTH_PAGES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Someone already signed in has no use for the sign-in form.
  if (hasSession && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
