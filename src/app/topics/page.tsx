import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import PaperTear from "@/components/PaperTear";
import TopicSprite from "@/components/TopicSprite";
import { countByTopic } from "@/lib/articles/queries";
import { TOPICS } from "@/lib/topics";

/**
 * All twenty, side by side.
 *
 * The home page's field drifts and hides its list behind hover; this is the
 * same twenty as a plain index, which is what "Explore all topics" was already
 * promising before there was anywhere for it to go.
 */

/**
 * Prerendered for the twenty, then refreshed on a timer.
 *
 * Without this the page is built once and a piece published afterwards never
 * appears on it — which is the one thing a topic page exists to do. Five
 * minutes is the longest a new piece should be invisible here.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Topics — Glitch Decoded",
  description:
    "The twenty things this magazine keeps returning to: loneliness, death, envy, failure, aging, money, meaning and the rest.",
  alternates: { canonical: "/topics" },
};

export default async function TopicsPage() {
  // A count per topic, or none at all if Appwrite is unreachable — the index
  // still lists every topic and every link still works.
  let counts: Record<string, number> = {};
  try {
    counts = await countByTopic();
  } catch {
    counts = {};
  }

  return (
    <>
      <main className="flex-1">
        <header className="bg-[#0b0a08] px-5 pt-32 pb-16 text-center text-[color:var(--bone)] sm:px-10 sm:pt-40 sm:pb-20">
          <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
            The quiet list
          </p>
          <h1 className="mt-4 font-pixel text-[30px] leading-[1.12] uppercase sm:text-[46px]">
            Topics
          </h1>
          <p className="mx-auto mt-6 max-w-[48ch] font-garamond text-[19px] leading-[1.5] opacity-70 sm:text-[22px]">
            The things this magazine keeps returning to. A piece runs under one
            perspective and turns up under as many of these as it is about.
          </p>
        </header>

        <PaperTear sheet="#0b0a08" ground="var(--graphite)" />

        <section className="bg-[color:var(--graphite)] pb-20 text-[color:var(--ink)] sm:pb-28">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-10">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {TOPICS.map((topic) => {
                const count = counts[topic.slug] ?? 0;
                return (
                  <li key={topic.slug}>
                    <Link
                      href={`/topics/${topic.slug}`}
                      className="group flex flex-col items-center gap-3 text-center transition-transform duration-200 hover:-translate-y-1"
                    >
                      <TopicSprite rows={topic.rows} color={topic.hue} />
                      <span
                        className="font-pixel text-[13px] tracking-[0.04em] uppercase sm:text-[15px]"
                        style={{ color: topic.hue }}
                      >
                        {topic.name}
                      </span>
                      <span className="font-garamond text-[15px] leading-[1.4] opacity-55">
                        {topic.blurb}
                      </span>
                      <span className="font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-35">
                        {count === 0
                          ? "Nothing yet"
                          : `${count} ${count === 1 ? "piece" : "pieces"}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>

      <Footer sheet="var(--graphite)" />
    </>
  );
}
