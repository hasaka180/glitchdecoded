import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleGrid } from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import PaperTear from "@/components/PaperTear";
import TopicSprite from "@/components/TopicSprite";
import type { Article } from "@/lib/archive";
import { rowToArticle } from "@/lib/articles/listing";
import { listByTopic } from "@/lib/articles/queries";
import { TOPICS, topicBySlug } from "@/lib/topics";

/**
 * Everything published under one topic.
 *
 * A topic cuts across the six perspectives — a piece about grief may run under
 * Human or Nature — so this is the other axis of the archive, and the page the
 * sprites on the home page land on.
 */

/**
 * Prerendered for the twenty, then refreshed on a timer.
 *
 * Without this the page is built once and a piece published afterwards never
 * appears on it — which is the one thing a topic page exists to do. Five
 * minutes is the longest a new piece should be invisible here.
 */
export const revalidate = 300;

/** Twenty known slugs, so every topic page is prerendered rather than resolved. */
export function generateStaticParams() {
  return TOPICS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/topics/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const topic = topicBySlug(slug);
  if (!topic) return {};

  return {
    title: `${topic.name} — Glitch Decoded`,
    description: topic.blurb,
    alternates: { canonical: `/topics/${topic.slug}` },
  };
}

export default async function TopicPage(props: PageProps<"/topics/[slug]">) {
  const { slug } = await props.params;
  const topic = topicBySlug(slug);
  if (!topic) notFound();

  // An unreachable Appwrite empties the page rather than failing the build —
  // the same tolerance the rest of the front of the site has.
  let articles: Article[] = [];
  try {
    articles = (await listByTopic(topic.slug)).map(rowToArticle);
  } catch {
    articles = [];
  }

  const others = TOPICS.filter((t) => t.slug !== topic.slug);

  return (
    <>
      <main className="flex-1">
        <header className="relative bg-[#0b0a08] px-5 pt-32 pb-16 text-center text-[color:var(--bone)] sm:px-10 sm:pt-40 sm:pb-20">
          <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
            Topic
          </p>

          <span className="mt-8 inline-block">
            <TopicSprite
              rows={topic.rows}
              color={topic.hue}
              className="size-16 sm:size-20"
            />
          </span>

          <h1
            className="mt-6 font-pixel text-[30px] leading-[1.12] uppercase sm:text-[46px]"
            style={{ color: topic.hue }}
          >
            {topic.name}
          </h1>

          <p className="mx-auto mt-6 max-w-[44ch] font-garamond text-[19px] leading-[1.5] opacity-70 sm:text-[22px]">
            {topic.blurb}
          </p>

          <p className="mt-8 font-arial text-[9px] font-bold tracking-[0.18em] uppercase opacity-40">
            {articles.length === 0
              ? "Nothing filed here yet"
              : `${articles.length} ${articles.length === 1 ? "piece" : "pieces"}`}
          </p>
        </header>

        <PaperTear sheet="#0b0a08" ground="var(--graphite)" />

        <section className="relative bg-[color:var(--graphite)] pb-20 text-[color:var(--ink)] sm:pb-28">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-10">
            <ArticleGrid articles={articles} />

            <nav className="mt-20 border-t border-[color:var(--ink)]/15 pt-10 sm:mt-28">
              <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50">
                Other topics
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-4">
                {others.map((other) => (
                  <li key={other.slug}>
                    <Link
                      href={`/topics/${other.slug}`}
                      className="group inline-flex items-center gap-3 font-pixel text-[14px] uppercase opacity-70 transition-opacity hover:opacity-100 sm:text-[16px]"
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 transition-transform duration-200 group-hover:scale-125"
                        style={{ backgroundColor: other.hue }}
                      />
                      {other.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
      </main>

      <Footer sheet="var(--graphite)" />
    </>
  );
}
