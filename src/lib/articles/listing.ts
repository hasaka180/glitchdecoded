import "server-only";

import { cache } from "react";

import { ARTICLES, type Article } from "@/lib/archive";
import { PICKS, type Pick } from "@/lib/recommended";
import { categoryHue, categoryName } from "@/lib/categories";
import { topicName } from "@/lib/topics";
import { listPublished } from "@/lib/articles/queries";
import type { ArticleRow } from "@/lib/articles/types";
import type { CategorySlug } from "@/lib/categories";

/**
 * The listings, from both sources.
 *
 * The front of the site was written against `lib/archive.ts` — a hand-written
 * array of placeholders — while the desk was being built. Now that the desk
 * publishes, a piece that goes live has to appear on the category pages too,
 * or the CMS produces work no reader ever finds.
 *
 * Same precedence as `article-view.ts`: a published row always beats a
 * placeholder with the same slug, so the archive can be deleted an entry at a
 * time as real pieces replace it, with nothing to change here.
 */

/** A published row in the shape the cards were written for. */
export function rowToArticle(row: ArticleRow): Article {
  return {
    slug: row.slug,
    category: row.category as CategorySlug,
    title: row.title,
    dek: row.dek ?? "",
    author: row.authorName,
    date: (row.publishedAt ?? row.$createdAt).slice(0, 10),
    minutes: row.minutes,
    ...(row.coverImageUrl
      ? { image: { url: row.coverImageUrl, alt: row.coverAlt ?? "" } }
      : {}),
  };
}

/**
 * Everything published, newest first.
 *
 * Memoised per render pass: a category page asks for it, its count asks for
 * it, and the index asks for it seven times over — one round trip covers them.
 * An unreachable Appwrite returns nothing rather than throwing, so the archive
 * still renders and the page stays up.
 */
const publishedRows = cache(async (): Promise<ArticleRow[]> => {
  try {
    return await listPublished(200);
  } catch {
    return [];
  }
});

/** The same set in the shape the cards were written for. */
const published = cache(async (): Promise<Article[]> =>
  (await publishedRows()).map(rowToArticle),
);

/** Published first, then any placeholder whose slug hasn't been taken over. */
function merge(live: Article[], archive: Article[]): Article[] {
  const taken = new Set(live.map((a) => a.slug));
  return [...live, ...archive.filter((a) => !taken.has(a.slug))].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export async function articlesInCategory(slug: string): Promise<Article[]> {
  const live = (await published()).filter((a) => a.category === slug);
  const archive = ARTICLES.filter((a) => a.category === slug);
  return merge(live, archive);
}

export async function recentArticles(limit: number): Promise<Article[]> {
  return merge(await published(), [...ARTICLES]).slice(0, limit);
}

/** How many pieces sit under each category, for the index's counts. */
export async function countByCategory(): Promise<Record<string, number>> {
  const all = merge(await published(), [...ARTICLES]);
  const counts: Record<string, number> = {};
  for (const article of all) {
    counts[article.category] = (counts[article.category] ?? 0) + 1;
  }
  return counts;
}

/**
 * The five under the topic field, newest first.
 *
 * The section's layout is one featured card and a 2x2, so it needs exactly
 * five: published work fills it from the front and the shipped picks make up
 * the difference, which is what keeps the grid whole on a site with two pieces
 * on it. A pick whose slug has since been published is dropped rather than
 * shown twice.
 */
export async function recommendedPicks(limit = 5): Promise<Pick[]> {
  const live = (await publishedRows()).slice(0, limit).map(
    (row): Pick => ({
      slug: row.slug,
      // Unlike the shipped picks, this one has a page behind it.
      href: `/read/${row.slug}`,
      title: row.title,
      dek: row.dek ?? "",
      category: categoryName(row.category),
      // The reason line wants something true about the piece. The desk's first
      // topic is that; the perspective is the fallback when nothing is tagged.
      from: row.topics?.[0] ? topicName(row.topics[0]) : categoryName(row.category),
      minutes: row.minutes,
      hue: categoryHue(row.category),
      image: row.coverImageUrl ?? `/assets/categories/${row.category}.png`,
      // A cover is a photograph; the category art it falls back to is not.
      pixel: !row.coverImageUrl,
    }),
  );

  const taken = new Set(live.map((p) => p.slug));
  return [...live, ...PICKS.filter((p) => !taken.has(p.slug))].slice(0, limit);
}
