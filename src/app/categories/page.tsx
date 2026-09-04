import type { Metadata } from "next";
import Link from "next/link";

import { ArticleGrid } from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import PageMasthead from "@/components/PageMasthead";
import PaperTear from "@/components/PaperTear";
import { countByCategory, recentArticles } from "@/lib/articles/listing";
import { CATEGORIES } from "@/lib/categories";

/**
 * Refreshed on a timer rather than frozen at build.
 *
 * This page now lists what the desk has published as well as the archive, and
 * a piece nobody can find is the same as one nobody wrote.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Categories — Glitch Decoded",
  description:
    "Six ways into the archive: unpopular, untold, reality check, deep dives, nature and human.",
};

/**
 * The index of the six. The cards are the rail's cards, laid out as a grid
 * rather than a scroll — a page you arrive at deliberately does not need to be
 * dragged, and a grid shows all six without a single gesture.
 */
export default async function CategoriesPage() {
  // One round trip covers both: `listing` memoises the published rows per pass.
  const [counts, recent] = await Promise.all([countByCategory(), recentArticles(9)]);

  return (
    <>
      <main className="flex-1">
        <PageMasthead
          eyebrow="Explore by perspective"
          title="Six ways in"
          dek="The same archive, sorted by the angle a piece takes rather than the day it ran. Pick the one you turned up in."
          rule={false}
        />

        <PaperTear sheet="var(--ink)" ground="var(--graphite)" />

        <section className="relative bg-[color:var(--graphite)] pb-20 text-[color:var(--ink)] sm:pb-28">
          <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-10">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => {
                const count = counts[category.slug] ?? 0;

                return (
                  <li key={category.slug}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="pixel-corner group relative flex aspect-[3/4] flex-col justify-between overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-1"
                      style={{
                        backgroundImage: `linear-gradient(160deg, ${category.from}, ${category.to})`,
                      }}
                    >
                      {category.image && (
                        <span
                          aria-hidden
                          className="card-sprite absolute inset-0"
                          style={{ backgroundImage: `url(${category.image})` }}
                        />
                      )}
                      <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `linear-gradient(to bottom, ${category.to}cc 0%, transparent 32%, transparent 45%, ${category.to}e6 100%)`,
                        }}
                      />

                      <span className="relative flex items-start justify-between gap-4">
                        <span
                          className="font-pixel text-[26px] leading-none tracking-[0.02em] uppercase"
                          style={{ color: category.hue }}
                        >
                          {category.name}
                        </span>
                        <span className="mt-1 font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
                          {count} {count === 1 ? "piece" : "pieces"}
                        </span>
                      </span>

                      <span className="relative flex items-end justify-between gap-4">
                        <span className="max-w-[24ch] text-[13px] leading-[1.5] text-white/90">
                          {category.blurb}
                        </span>
                        <span className="pixel-corner-sm flex size-9 shrink-0 items-center justify-center bg-white/15 text-sm text-white transition-colors group-hover:bg-white group-hover:text-[color:var(--graphite)]">
                          <span aria-hidden>→</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* everything, newest first, whichever perspective it came from */}
            <div className="mt-20 sm:mt-28">
              <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
                Across all six
              </p>
              <h2 className="mt-4 font-pixel text-[clamp(1.5rem,3.6vw,2.4rem)] leading-[1.15] uppercase">
                Most recent
              </h2>

              <div className="mt-10">
                <ArticleGrid articles={recent} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer sheet="var(--graphite)" />
    </>
  );
}
