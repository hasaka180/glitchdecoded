import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleBody from "@/components/ArticleBody";
import { getArticleView, type ArticleView } from "@/lib/article-view";
import { getPublishedBySlug, listPublished } from "@/lib/articles/queries";
import { categoryName } from "@/lib/categories";

/**
 * A published piece.
 *
 * `getPublishedBySlug` filters on status, so an unpublished or withdrawn piece
 * 404s here even for its own author — the editor is where they read their draft.
 */

/**
 * Refreshed on a timer. Without it a piece is rendered once and cached for
 * good, so an edit the desk makes after publication never reaches a reader.
 */
export const revalidate = 300;

/** Trims to a whole word rather than mid-syllable, for the search snippet. */
function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max))}…`;
}

/** Strips markdown to plain prose for meta descriptions. */
function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({
  params,
}: PageProps<"/read/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedBySlug(slug);

  if (!article) return { title: "Not found" };

  const title = article.seoTitle || article.title;
  const description =
    article.seoDescription ||
    article.dek ||
    truncate(plainText(article.body), 155);

  // An uploaded cover is a photograph of the thing the piece is about, which
  // beats the generated card. With none, `opengraph-image.tsx` still applies —
  // Next attaches it automatically when `images` is left unset.
  const images = article.coverImageUrl
    ? [
        // No width and height: the upload is whatever ratio the writer chose,
        // and declaring 1200x630 over a portrait photograph makes the preview
        // wrong in a way the crawler would otherwise have got right itself.
        { url: article.coverImageUrl, alt: article.coverAlt || title },
      ]
    : undefined;

  return {
    title,
    description,
    authors: [{ name: article.authorName }],
    alternates: { canonical: `/read/${article.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/read/${article.slug}`,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.$updatedAt,
      authors: [article.authorName],
      section: categoryName(article.category),
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/** Pre-renders what is already live; anything published later renders on demand. */
export async function generateStaticParams() {
  try {
    const articles = await listPublished(50);
    return articles.map((article) => ({ slug: article.slug }));
  } catch {
    // An unreachable or unconfigured Appwrite shouldn't fail the build — the
    // route still renders on demand once the backend is up.
    return [];
  }
}

/**
 * Structured data, so a search engine reads the piece as an article rather
 * than as a page with words on it — this is what puts the byline and the date
 * in a result, and makes the piece eligible for a rich snippet.
 *
 * `JSON.stringify` escapes quotes but not `</script>`, and titles here are
 * written by anyone who signs up, so `<` is escaped before it can close the
 * tag it sits inside.
 */
function articleJsonLd(article: ArticleView, description: string) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description,
    ...(article.coverImageUrl ? { image: [article.coverImageUrl] } : {}),
    ...(article.date ? { datePublished: article.date } : {}),
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: "Glitch Decoded" },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/read/${article.slug}`,
    },
    articleSection: article.categoryName,
    wordCount: article.body
      ? article.body.trim().split(/\s+/).filter(Boolean).length
      : undefined,
  };

  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function ReadPage({ params }: PageProps<"/read/[slug]">) {
  const { slug } = await params;
  // Resolved through the shared view so a hard load of a shared modal URL finds
  // the same piece the listing did — including the archive placeholders the
  // category pages list while the desk fills Appwrite.
  const article = await getArticleView(slug);
  if (!article) notFound();


  const description =
    article.dek || (article.body ? truncate(plainText(article.body), 155) : "");

  return (
    <main className="paper flex-1 pt-28 pb-24 text-[color:var(--ink-brown)] sm:pt-36">
      <script
        type="application/ld+json"
        // Escaped above; the only thing this ever contains is that JSON.
        dangerouslySetInnerHTML={{ __html: articleJsonLd(article, description) }}
      />

      <div className="mx-auto w-full max-w-[46rem] px-5 sm:px-10">
        <ArticleBody article={article} />

        <footer className="mt-12 border-t border-[color:var(--ink-brown)]/20 pt-8">
          <Link
            href={`/categories/${article.category}`}
            className="font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-55 transition-opacity hover:opacity-100"
          >
            ← More in {article.categoryName.toLowerCase()}
          </Link>
        </footer>
      </div>
    </main>
  );
}
