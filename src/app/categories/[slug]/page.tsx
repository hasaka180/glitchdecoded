import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleCard, { ArticleGrid } from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import PageMasthead from "@/components/PageMasthead";
import PaperTear from "@/components/PaperTear";
import { articlesInCategory } from "@/lib/articles/listing";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";

/**
 * Refreshed on a timer rather than frozen at build.
 *
 * This page now lists what the desk has published as well as the archive, and
 * a piece nobody can find is the same as one nobody wrote.
 */
export const revalidate = 300;

/** Six known slugs, so every category page is prerendered rather than resolved. */
export function generateStaticParams() {
  return CATEGORIES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/categories/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = categoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} — Glitch Decoded`,
    description: category.blurb,
  };
}

export default async function CategoryPage(
  props: PageProps<"/categories/[slug]">,
) {
  const { slug } = await props.params;
  const category = categoryBySlug(slug);
  if (!category) notFound();

  const articles = await articlesInCategory(category.slug);
  const [lead, ...rest] = articles;
  const others = CATEGORIES.filter((c) => c.slug !== category.slug);

  return (
    <>
      <main className="flex-1">
        <PageMasthead
          eyebrow="Perspective"
          title={category.name}
          dek={category.standfirst}
          hue={category.hue}
          art={category.slug}
          rule={false}
        />

        <PaperTear sheet="var(--ink)" ground="var(--graphite)" />

        <section className="relative bg-[color:var(--graphite)] pb-20 text-[color:var(--ink)] sm:pb-28">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-10">
            {lead ? (
              <>
                <ArticleCard article={lead} size="lead" />

                <div className="mt-12 sm:mt-16">
                  <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
                    More in {category.name.toLowerCase()}
                  </p>
                  <div className="mt-8">
                    <ArticleGrid articles={rest} />
                  </div>
                </div>
              </>
            ) : (
              <ArticleGrid articles={[]} />
            )}

            {/* the other five, as a rule rather than a rail */}
            <nav className="mt-20 border-t border-[color:var(--ink)]/15 pt-10 sm:mt-28">
              <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50">
                Other perspectives
              </p>

              <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                {others.map((other) => (
                  <li key={other.slug}>
                    <Link
                      href={`/categories/${other.slug}`}
                      className="group inline-flex items-center gap-3 font-pixel text-[16px] uppercase opacity-70 transition-opacity hover:opacity-100 sm:text-[18px]"
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

              <Link
                href="/categories"
                className="mt-8 inline-flex items-center gap-2 font-garamond text-[16px] opacity-70 transition-opacity hover:opacity-100"
              >
                All six, side by side <span aria-hidden>→</span>
              </Link>
            </nav>
          </div>
        </section>
      </main>

      <Footer sheet="var(--graphite)" />
    </>
  );
}
