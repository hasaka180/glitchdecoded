"use client";

import { usePathname } from "next/navigation";

import GlitchNav from "@/components/GlitchNav";

/**
 * Shows the floating site nav everywhere except the app surfaces.
 *
 * `GlitchNav` is a fixed, right-aligned cluster at z-50, which would land on
 * top of the dashboard's own header. The dashboard carries a "View site" link
 * instead, so nothing is lost by standing the nav down there.
 *
 * A client wrapper rather than a change inside `GlitchNav` itself: the nav's
 * own file is mid-edit, and route awareness isn't its concern anyway.
 */
const APP_ROUTES = ["/dashboard", "/login", "/signup"];

export default function SiteChrome() {
  const pathname = usePathname();
  if (APP_ROUTES.some((route) => pathname.startsWith(route))) return null;
  return <GlitchNav />;
}
