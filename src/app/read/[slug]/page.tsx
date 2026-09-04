import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleBody from "@/components/ArticleBody";
import { getArticleView } from "@/lib/article-view";
import { getPublishedBySlug, listPublished } from "@/lib/articles/queries";
import { categoryName } from "@/lib/categories";

/**
 * A published piece.
 *
 * `getPublishedBySlug` filters on status, so an unpublished or withdrawn piece
 * 404s here even for its own author — the editor is where they read their draft.
 */

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

  return {
    title,
    description,
    alternates: { canonical: `/read/${article.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/read/${article.slug}`,
      publishedTime: article.publishedAt ?? undefined,
      authors: [article.authorName],
      section: categoryName(article.category),
    },
    twitter: { card: "summary_large_image", title, description },
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

export default async function ReadPage({ params }: PageProps<"/read/[slug]">) {
  const { slug } = await params;
  // Resolved through the shared view so a hard load of a shared modal URL finds
  // the same piece the listing did — including the archive placeholders the
  // category pages list while the desk fills Appwrite.
  const article = await getArticleView(slug);
  if (!article) notFound();


  return (
    <main className="paper flex-1 pt-28 pb-24 text-[color:var(--ink-brown)] sm:pt-36">
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
