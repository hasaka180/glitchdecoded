"use client";

import { useCallback, useEffect, useRef } from "react";

type Category = {
  name: string;
  blurb: string;
  /** Accent used for the label and the card's light. */
  hue: string;
  /** Two stops for the card's ground. */
  from: string;
  to: string;
  /**
   * Optional art, drawn under the gradient with `image-rendering: pixelated`.
   * Supply a deliberately small file (~240px wide) — it is stretched to the
   * card, so the upscale is what produces the blocks.
   */
  image?: string;
};

const CATEGORIES: Category[] = [
  {
    name: "Unpopular",
    image: "/assets/categories/unpopular.png",
    blurb: "Ideas worth considering, even when they're uncomfortable.",
    hue: "#e8d24a",
    from: "#3a3324",
    to: "#0b0a08",
  },
  {
    name: "Untold",
    image: "/assets/categories/untold.png",
    blurb: "Stories and truths that don't get enough attention.",
    hue: "#4fd0e0",
    from: "#13323f",
    to: "#050f16",
  },
  {
    name: "Reality check",
    image: "/assets/categories/reality-check.png",
    blurb: "Things we've accepted without ever asking why.",
    hue: "#e08a3c",
    from: "#43301c",
    to: "#120c06",
  },
  {
    name: "Deep dives",
    image: "/assets/categories/deep-dives.png",
    blurb: "Long-form explorations into life, society, mind and existence.",
    hue: "#a98cf0",
    from: "#241f3d",
    to: "#0a0813",
  },
  {
    name: "Nature",
    image: "/assets/categories/nature.png",
    blurb: "Lessons, harmony and perspective from the natural world.",
    hue: "#8fce5a",
    from: "#22341d",
    to: "#080d06",
  },
  {
    name: "Human",
    image: "/assets/categories/human.png",
    blurb: "The beautiful, messy business of being human.",
    hue: "#6fa8ef",
    from: "#1d2a3d",
    to: "#070b11",
  },
];

type Props = {
  /** Rendered inside a pinned stage: fill the viewport instead of flowing. */
  inStage?: boolean;
  /**
   * 0-1 along the rail, driven by page scroll while the stage is pinned.
   * Omitted, the rail is scrolled by hand as usual.
   */
  scrollProgress?: number;
};

export default function PerspectiveRail({ inStage, scrollProgress }: Props = {}) {
  const railRef = useRef<HTMLUListElement | null>(null);
  const driven = scrollProgress != null;

  // While pinned, page scroll walks the rail along. Setting scrollLeft rather
  // than transforming keeps it a real scroll container, so a swipe still works
  // and nothing has to be undone when the stage lets go.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || scrollProgress == null) return;
    rail.scrollLeft = (rail.scrollWidth - rail.clientWidth) * scrollProgress;
  }, [scrollProgress]);

  /** Scroll by one card, whatever the current card width works out to be. */
  const nudge = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 16 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: step * direction, behavior: "smooth" });
  }, []);

  return (
    <section
      id="perspectives"
      className={`relative scroll-mt-20 bg-[color:var(--graphite)] text-white ${
        inStage
          ? "flex h-full items-center"
          : "pt-6 pb-24 sm:pb-28"
      }`}
    >
      <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-10">
        <div className="mb-6 flex items-end justify-between gap-6">
          <h2 className="font-arial text-[10px] font-bold tracking-[0.3em] text-black uppercase opacity-80 sm:text-[11px]">
            Explore by perspective
          </h2>

          <div className="flex items-center gap-4">
            <a
              href="#categories"
              className="hidden font-garamond text-[15px] tracking-wide text-black opacity-80 transition-opacity hover:opacity-100 sm:inline-flex sm:items-center sm:gap-2"
            >
              View all categories <span aria-hidden>→</span>
            </a>
            <div className="flex gap-2">
              {([-1, 1] as const).map((direction) => (
                <button
                  key={direction}
                  type="button"
                  onClick={() => nudge(direction)}
                  aria-label={direction === -1 ? "Previous categories" : "Next categories"}
                  className="pixel-corner-sm flex size-9 items-center justify-center bg-black/10 text-sm text-black transition-colors hover:bg-black/20"
                >
                  <span aria-hidden>{direction === -1 ? "←" : "→"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <ul
          ref={railRef}
          className={`scrollbar-none flex gap-4 overflow-x-auto pb-2 ${
            driven ? "" : "snap-x snap-mandatory"
          }`}
        >
          {CATEGORIES.map((category) => (
            <li
              key={category.name}
              className={`w-[78vw] shrink-0 sm:w-[52vw] md:w-[38vw] lg:w-[calc((100%-3rem)/4)] ${
                driven ? "" : "snap-start"
              }`}
            >
              <a
                href={`#${category.name.toLowerCase().replace(/\s+/g, "-")}`}
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
                {/* keeps the copy legible over whatever the art is doing */}
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, ${category.to}cc 0%, transparent 32%, transparent 45%, ${category.to}e6 100%)`,
                  }}
                />

                <span
                  className="relative font-pixel text-[26px] leading-none tracking-[0.02em] uppercase"
                  style={{ color: category.hue }}
                >
                  {category.name}
                </span>

                <div className="relative flex items-end justify-between gap-4">
                  <p className="max-w-[24ch] text-[13px] leading-[1.5] text-white/90">
                    {category.blurb}
                  </p>
                  <span className="pixel-corner-sm flex size-9 shrink-0 items-center justify-center bg-white/15 text-sm transition-colors group-hover:bg-white group-hover:text-[color:var(--graphite)]">
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#categories"
          className="mt-8 inline-flex items-center gap-2 font-garamond text-[15px] text-black opacity-80 sm:hidden"
        >
          View all categories <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
