"use client";

import Link from "next/link";
import { useState } from "react";

import TopicSprite from "@/components/TopicSprite";
import { TOPICS } from "@/lib/topics";



/** Static vertical offsets so the tiles read as a scatter, not a grid. */
const NUDGE = [0, 22, 8, 30, 14, 26, 4, 18];

export default function TopicField() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section
      id="topics"
      className="relative overflow-hidden bg-[color:var(--graphite)] py-20 text-[color:var(--ink)] sm:py-28"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-10">
        <header className="mb-14 text-center sm:mb-20">
          <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
            The quiet list
          </p>
          <h2 className="mt-4 font-pixel text-[26px] leading-[1.15] tracking-[0.02em] uppercase sm:text-[42px]">
            The topics we rarely discuss
          </h2>
        </header>

        <ul
          className="flex flex-wrap items-start justify-center gap-x-6 gap-y-10 sm:gap-x-12 sm:gap-y-14"
          onPointerLeave={() => setActive(null)}
        >
          {TOPICS.map((topic, i) => {
            const open = active === i;
            return (
              <li
                key={topic.name}
                className={`relative ${open ? "z-20" : "z-0"}`}
                style={{ marginTop: NUDGE[i % NUDGE.length] }}
              >
                <span
                  className="topic-drift block"
                  style={{
                    animationDuration: `${5.5 + (i % 5) * 0.7}s`,
                    animationDelay: `-${(i % 7) * 0.9}s`,
                  }}
                >
                  {/* A link, not a button: the blurb is what hovering says,
                      and clicking goes to everything filed under it. On touch,
                      where there is no hover, the first tap opens the blurb and
                      the second follows the link. */}
                  <Link
                    href={`/topics/${topic.slug}`}
                    aria-describedby={open ? `topic-${topic.slug}` : undefined}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive((current) => (current === i ? null : current))}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") setActive(i);
                    }}
                    onClick={(event) => {
                      if (!open) {
                        event.preventDefault();
                        setActive(i);
                      }
                    }}
                    className="flex w-[86px] cursor-pointer flex-col items-center gap-2 outline-none transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 sm:w-[104px]"
                  >
                    <span
                      className="transition-[filter,opacity] duration-200"
                      style={{
                        opacity: active == null || open ? 1 : 0.35,
                        filter: open ? "drop-shadow(0 3px 4px rgba(0,0,0,0.35))" : undefined,
                      }}
                    >
                      <TopicSprite rows={topic.rows} color={topic.hue} />
                    </span>
                    <span
                      className="font-pixel text-[11px] tracking-[0.04em] uppercase transition-opacity duration-200 sm:text-[13px]"
                      style={{
                        color: open ? topic.hue : undefined,
                        opacity: active == null || open ? 0.85 : 0.3,
                      }}
                    >
                      {topic.name}
                    </span>
                  </Link>
                </span>

                {open && (
                  <div
                    role="tooltip"
                    id={`topic-${topic.slug}`}
                    className="topic-scroll pointer-events-none absolute top-full left-1/2 mt-3 w-[min(15rem,72vw)] -translate-x-1/2"
                  >
                    {/* rolled ends, so the panel reads as a scroll rather than a card */}
                    <span className="block h-[6px] bg-[color:var(--ink-brown)]" />
                    <p className="paper px-4 py-3 text-center font-garamond text-[15px] leading-[1.45] text-[color:var(--ink-brown)]">
                      {topic.blurb}
                    </p>
                    <span className="block h-[6px] bg-[color:var(--ink-brown)]" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-20 text-center sm:mt-24">
          <Link
            href="/topics"
            className="inline-flex items-center gap-2 font-garamond text-[17px] tracking-wide opacity-75 transition-opacity hover:opacity-100"
          >
            Explore all topics <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
