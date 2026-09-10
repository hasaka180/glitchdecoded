import type { MetadataRoute } from "next";

import { listPublished } from "@/lib/articles/queries";
import { CATEGORIES } from "@/lib/categories";
import { SITE_URL } from "@/lib/site";
import { TOPICS } from "@/lib/topics";

/**
 * Rebuilt on the same timer as the home page, because it lists the same
 * pieces. A sitemap frozen at deploy would keep pointing search engines at
 * whatever was published the last time the site went out, which is the one
 * thing a sitemap must not do.
 */
export const revalidate = 300;

/** How many published pieces to advertise. Well clear of the current archive. */
const ARTICLE_LIMIT = 500;

/**
 * The routes worth crawling, and nothing else.
 *
 * Deliberately absent: `/dashboard` and everything under it, `/login` and
 * `/signup`, and `/submit` — which is not a page at all but a redirect that
 * lands a visitor on the sign-in screen and a contributor on the desk. Listing
 * a redirect tells a crawler the URL is canonical when it never renders.
 */
const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/topics", changeFrequency: "weekly", priority: 0.8 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.8 },
  { path: "/notes", changeFrequency: "daily", priority: 0.7 },
  { path: "/video-library", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  const topicEntries = TOPICS.map((topic) => ({
    url: `${SITE_URL}/topics/${topic.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const categoryEntries = CATEGORIES.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // The pieces themselves are what anyone is actually looking for, so they
  // carry the highest priority after the front page.
  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const rows = await listPublished(ARTICLE_LIMIT);
    articleEntries = rows.map((row) => ({
      url: `${SITE_URL}/read/${row.slug}`,
      // `publishedAt` is when it went live; `$updatedAt` moves on every edit,
      // including a correction logged after the fact, which is exactly what a
      // crawler should come back for.
      lastModified: new Date(row.$updatedAt ?? row.publishedAt ?? now),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }));
  } catch {
    // An unreachable or unconfigured Appwrite shouldn't fail the build or
    // serve a broken sitemap — the same trade the article route already makes
    // in its generateStaticParams. The standing pages still get listed, and
    // the pieces reappear on the next revalidation once the backend is up.
  }

  return [
    ...staticEntries,
    ...articleEntries,
    ...topicEntries,
    ...categoryEntries,
  ];
}
