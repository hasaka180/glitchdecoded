import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * The companion to sitemap.ts — a sitemap nothing points at is a sitemap
 * nothing finds. `Sitemap:` here is how a crawler that was never submitted
 * the URL by hand discovers it.
 *
 * The disallowed paths are the ones behind a session: the desk, the sign-in
 * screens, the API, and `/submit`, which only ever redirects to one of them.
 * None of them would render anything useful to a crawler, and `/dashboard`
 * would answer every request with the login redirect.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/dashboard/", "/login", "/signup", "/submit"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
