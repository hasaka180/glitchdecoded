/**
 * Where a link to this site is unfurled — a search result, a chat preview, a
 * card in a timeline — this is what it says. `metadataBase` is what lets the
 * relative `url` and `canonical` paths the article pages already set resolve
 * to absolute ones, and the sitemap needs the same origin to write absolute
 * `<loc>` entries. They have to agree: a sitemap that advertises a different
 * host from the canonical tag is a sitemap search engines will argue with.
 *
 * The fallback chain exists because getting this wrong is silent and total:
 * with only a localhost default, a deploy that never had NEXT_PUBLIC_SITE_URL
 * set advertised its share card at http://localhost:3000/opengraph-image, which
 * no scraper on earth can fetch — so every shared link unfurled as text with a
 * blank space where the card should be, and nothing in the build complained.
 *
 * NEXT_PUBLIC_SITE_URL still wins, because it is the only one that knows which
 * host is canonical when a site answers on both the apex and www. The two after
 * it are Vercel's own, and cost nothing where they are absent.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  // The project's production domain, and then this particular deployment —
  // a preview should unfurl its own card rather than production's.
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

/** The origin, with any trailing slash removed so paths concatenate cleanly. */
export const SITE_URL = siteUrl().replace(/\/$/, "");
