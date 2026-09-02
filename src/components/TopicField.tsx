"use client";

import { useMemo, useState } from "react";

/**
 * Icons are 11x11 bitmaps — '#' is a lit pixel, '.' is empty. Drawn as SVG
 * rather than shipped as files so they stay crisp at any size and take the
 * topic's own colour.
 */
type Topic = {
  name: string;
  blurb: string;
  hue: string;
  rows: string[];
};

const TOPICS: Topic[] = [
  {
    name: "Loneliness",
    blurb: "The room can be full and still be empty.",
    hue: "#2f47a0",
    rows: [
      "....###....",
      "....###....",
      "...........",
      "...#####...",
      "..#.###.#..",
      "..#.###.#..",
      "....###....",
      "....#.#....",
      "....#.#....",
      "###########",
      "...........",
    ],
  },
  {
    name: "Death",
    blurb: "The one certainty we plan around and never plan for.",
    hue: "#2a2a33",
    rows: [
      "...#####...",
      "..#######..",
      ".#########.",
      ".#..###..#.",
      ".#..###..#.",
      ".####.####.",
      ".#########.",
      "..#######..",
      "..#.#.#.#..",
      "..#######..",
      "...........",
    ],
  },
  {
    name: "Envy",
    blurb: "The quiet arithmetic of comparing lives.",
    hue: "#2f6b3a",
    rows: [
      "...........",
      "...........",
      "....###....",
      "..##...##..",
      ".#..###..#.",
      "#..#####..#",
      ".#..###..#.",
      "..##...##..",
      "....###....",
      "...........",
      "...........",
    ],
  },
  {
    name: "Failure",
    blurb: "The teacher nobody signs up for.",
    hue: "#a4541a",
    rows: [
      "....###....",
      "....###....",
      "....###....",
      "....###....",
      "...........",
      "...........",
      ".#########.",
      "..#######..",
      "...#####...",
      "....###....",
      ".....#.....",
    ],
  },
  {
    name: "Aging",
    blurb: "Becoming a stranger to a body you have always lived in.",
    hue: "#5c4530",
    rows: [
      ".....#.....",
      "....###....",
      "....###....",
      ".....#.....",
      "...........",
      "...#####...",
      "...#...#...",
      "...#...#...",
      "...#...#...",
      "..#######..",
      "...........",
    ],
  },
  {
    name: "Money",
    blurb: "The thing we measure everything else against.",
    hue: "#2f6b3a",
    rows: [
      "...........",
      ".#########.",
      ".#...#...#.",
      ".#..###..#.",
      ".#.#.#...#.",
      ".#..###..#.",
      ".#....#..#.",
      ".#..###..#.",
      ".#...#...#.",
      ".#########.",
      "...........",
    ],
  },
  {
    name: "Meaning",
    blurb: "The question that outlives every answer.",
    hue: "#126b7d",
    rows: [
      ".....#.....",
      ".....#.....",
      "....###....",
      ".#.#####.#.",
      "..#######..",
      "###########",
      "..#######..",
      ".#.#####.#.",
      "....###....",
      ".....#.....",
      "...........",
    ],
  },
  {
    name: "Regret",
    blurb: "The conversations we keep having alone.",
    hue: "#5a3f9c",
    rows: [
      "..##.......",
      ".#..#......",
      ".#..#......",
      "..##.......",
      "...#.......",
      "...##......",
      "....#......",
      "....#..#...",
      "....#.##...",
      "....#......",
      "..#######..",
    ],
  },
  {
    name: "Time",
    blurb: "The only currency you cannot earn back.",
    hue: "#86701a",
    rows: [
      ".#########.",
      ".#.......#.",
      "..#.....#..",
      "...#...#...",
      "....#.#....",
      ".....#.....",
      "....#.#....",
      "...#.#.#...",
      "..#..#..#..",
      ".#..###..#.",
      ".#########.",
    ],
  },
  {
    name: "Friendship",
    blurb: "The love we assume will look after itself.",
    hue: "#a4541a",
    rows: [
      ".##.....##.",
      ".##.....##.",
      "...........",
      ".###...###.",
      ".#########.",
      ".###...###.",
      ".#.#...#.#.",
      ".#.#...#.#.",
      "...........",
      "...........",
      "...........",
    ],
  },
  {
    name: "Desire",
    blurb: "The engine and the trap, usually at once.",
    hue: "#b3162a",
    rows: [
      ".....#.....",
      "....###....",
      "....###....",
      "...#####...",
      "..#######..",
      "..##...##..",
      ".##.....##.",
      ".##..#..##.",
      ".##.###.##.",
      "..#######..",
      "...#####...",
    ],
  },
  {
    name: "Identity",
    blurb: "Who you are when nobody is keeping score.",
    hue: "#126b7d",
    rows: [
      "...........",
      "...#####...",
      "..#.....#..",
      ".#..###..#.",
      ".#.#...#.#.",
      ".#.#.#.#.#.",
      ".#.#...#.#.",
      ".#..###..#.",
      "..#.....#..",
      "...#.#.#...",
      "...........",
    ],
  },
  {
    name: "Purpose",
    blurb: "Less a destination than a direction.",
    hue: "#b3162a",
    rows: [
      "....#####..",
      "....#...#..",
      "....#####..",
      "....#......",
      "....#......",
      "....#......",
      "....#......",
      "...........",
      "..#######..",
      ".#########.",
      "###########",
    ],
  },
  {
    name: "Shame",
    blurb: "The story you would never tell out loud.",
    hue: "#5a3f9c",
    rows: [
      "....###....",
      "...#####...",
      "..#######..",
      "..##...##..",
      "..##...##..",
      "..#######..",
      "...#####...",
      "....###....",
      "....###....",
      "...#####...",
      "...........",
    ],
  },
  {
    name: "Forgiveness",
    blurb: "Often less about them than about you.",
    hue: "#86701a",
    rows: [
      "..#.#.#....",
      ".##.#.#.#..",
      ".##.#.#.##.",
      ".#########.",
      ".#########.",
      ".#########.",
      "..#######..",
      "...#####...",
      "....###....",
      "...........",
      "...........",
    ],
  },
  {
    name: "Grief",
    blurb: "Love with nowhere left to go.",
    hue: "#2f47a0",
    rows: [
      "...#####...",
      "..#######..",
      ".#########.",
      "###########",
      ".#########.",
      "...........",
      "..#..#..#..",
      "..#..#..#..",
      "...........",
      "...#..#....",
      "...#..#....",
    ],
  },
  {
    name: "Change",
    blurb: "The thing we ask for and resist arriving.",
    hue: "#126b7d",
    rows: [
      ".##.....##.",
      "####.#.####",
      "###########",
      "####.#.####",
      ".##..#..##.",
      "..#..#..#..",
      ".....#.....",
      "...........",
      "...........",
      "...........",
      "...........",
    ],
  },
  {
    name: "Creativity",
    blurb: "Making something where nothing was owed.",
    hue: "#86701a",
    rows: [
      "....###....",
      "...#####...",
      "..##...##..",
      "..#.....#..",
      "..#.....#..",
      "..##...##..",
      "...#####...",
      "....###....",
      "....###....",
      "....#.#....",
      "....###....",
    ],
  },
  {
    name: "Work",
    blurb: "What we trade our hours for, and why.",
    hue: "#5c4530",
    rows: [
      "...........",
      "....###....",
      "...#...#...",
      ".#########.",
      ".#########.",
      ".####.####.",
      ".#########.",
      ".#########.",
      ".#########.",
      "...........",
      "...........",
    ],
  },
  {
    name: "Freedom",
    blurb: "Heavier to carry than it looks from outside.",
    hue: "#2f6b3a",
    rows: [
      "...........",
      "...........",
      ".##......#.",
      ".###....##.",
      ".####..###.",
      ".#########.",
      "..#######..",
      "...#####...",
      "....###....",
      ".....#.....",
      "...........",
    ],
  },
];

/** Contiguous lit runs per row, so a sprite is a handful of rects, not 121. */
function runs(rows: string[]) {
  const out: { x: number; y: number; w: number }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === "#") {
        let w = 1;
        while (row[x + w] === "#") w++;
        out.push({ x, y, w });
        x += w;
      } else x++;
    }
  });
  return out;
}

function PixelIcon({ rows, color }: { rows: string[]; color: string }) {
  const rects = useMemo(() => runs(rows), [rows]);
  return (
    <svg
      viewBox="0 0 11 11"
      shapeRendering="crispEdges"
      aria-hidden
      className="size-11 sm:size-14"
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={color} />
      ))}
    </svg>
  );
}

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
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setActive(open ? null : i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive((current) => (current === i ? null : current))}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") setActive(i);
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
                      <PixelIcon rows={topic.rows} color={topic.hue} />
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
                  </button>
                </span>

                {open && (
                  <div
                    role="tooltip"
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
          <a
            href="#all-topics"
            className="inline-flex items-center gap-2 font-garamond text-[17px] tracking-wide opacity-75 transition-opacity hover:opacity-100"
          >
            Explore all topics <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
