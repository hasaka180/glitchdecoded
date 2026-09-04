import "server-only";

import { ARTICLES } from "@/lib/archive";
import { getPublishedBySlug } from "@/lib/articles/queries";
import { categoryHue, categoryName } from "@/lib/categories";

/**
 * One shape for "a piece, ready to display", from either source.
 *
 * The front of the site lists the written archive in `src/lib/archive.ts`
 * while the desk fills Appwrite. Both have to be openable, or half the cards on
 * the category pages lead to a 404 — so this looks in Appwrite first and falls
 * back to the archive.
 *
 * `body` is null for an archive piece: those are headline, dek and byline only.
 * A caller renders the standfirst and says the piece is not filed yet, rather
 * than pretending to a body that was never written.
 */
export type ArticleView = {
  slug: string;
  title: string;
  dek: string;
  body: string | null;
  author: string;
  /** ISO date, or null where a placeholder has none. */
  date: string | null;
  minutes: number;
  category: string;
  categoryName: string;
  hue: string;
  coverImageUrl: string | null;
  /** What the cover shows. Empty means the image is decorative or undescribed. */
  coverAlt: string;
  /** Which source answered — the UI says so rather than guessing. */
  source: "published" | "archive";
};

export async function getArticleView(slug: string): Promise<ArticleView | null> {
  // Appwrite first: a real piece always wins over a placeholder of the same slug.
  try {
    const row = await getPublishedBySlug(slug);
    if (row) {
      return {
        slug: row.slug,
        title: row.title,
        dek: row.dek,
        body: row.body,
        author: row.authorName,
        date: row.publishedAt,
        minutes: row.minutes,
        category: row.category,
        categoryName: categoryName(row.category),
        hue: categoryHue(row.category),
        coverImageUrl: row.coverImageUrl,
        coverAlt: row.coverAlt ?? "",
        source: "published",
      };
    }
  } catch {
    // An unreachable or unprovisioned Appwrite must not take the archive down
    // with it — the placeholder below still renders.
  }

  const placeholder = ARTICLES.find((a) => a.slug === slug);
  if (!placeholder) return null;

  return {
    slug: placeholder.slug,
    title: placeholder.title,
    dek: placeholder.dek,
    body: null,
    author: placeholder.author,
    date: placeholder.date,
    minutes: placeholder.minutes,
    category: placeholder.category,
    categoryName: categoryName(placeholder.category),
    hue: categoryHue(placeholder.category),
    coverImageUrl: null,
    coverAlt: "",
    source: "archive",
  };
}
