"use client";

import { useEffect, useRef, useState } from "react";

import type { Note } from "@/lib/notes/seed";
import type { Reel } from "@/lib/videos";

import { useReducedMotion } from "@/lib/useReducedMotion";

import NoteWall from "./NoteWall";
import PaperTear from "./PaperTear";
import ScreeningRoom from "./ScreeningRoom";

/** Deterministic PRNG — the torn edge has to match between server and client. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The vertical tear, as offsets from the tear line in percent of viewport
 * width. A different seed from the rip that opened the category rail, so the
 * page does not tear along the same fibres twice.
 */
const TEAR = (() => {
  const rand = mulberry32(83);
  const steps = 46;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const bite = rand() > 0.92 ? (0.8 + rand() * 1.6) * (rand() > 0.5 ? 1 : -1) : 0;
    return { y: (i / steps) * 100, dx: (rand() - 0.5) * 1.4 + bite };
  });
})();

/**
 * Paper remaining, cut with the torn edge — and this time the sheet is held on
 * the *right*, so the edge sweeps left to right and uncovers the board from
 * the left. The mirror of the rip that opened the rail.
 */
function tearClip(edge: number) {
  const points = ["100% 0%"];
  for (const { y, dx } of TEAR) points.push(`${(edge + dx).toFixed(2)}% ${y.toFixed(2)}%`);
  points.push("100% 100%");
  return `polygon(${points.join(", ")})`;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Pins the film archive over the note board and tears it away to the right as
 * you scroll: the screening room is not a section you leave, it is the page
 * that gets scrapped to uncover the board underneath.
 *
 * The mirror of the rip that opened the category rail — that one held the
 * sheet on the left and uncovered from the right, this one holds it on the
 * right and uncovers from the left.
 *
 * The tear runs at every width, off one runway — the same length everywhere,
 * for the reason RipStage gives. Below lg the archive is one column rather
 * than two, so on a phone the set and its rail tighten to hold the pair inside
 * one viewport (see `.stage-tight` in globals.css).
 *
 * Under reduced motion there is still no pinning: the archive runs at its
 * natural height, the horizontal PaperTear does the transition, and the board
 * follows.
 */
export default function NoteRip({
  seed,
  reels,
}: {
  seed: Note[];
  reels: Reel[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);

  const staged = !reduced;

  useEffect(() => {
    if (!staged) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const runway = r.height - window.innerHeight;
      setProgress(runway > 0 ? clamp01(-r.top / runway) : 0);
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    request();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
  }, [staged]);

  if (!staged) {
    return (
      <>
        <ScreeningRoom reels={reels} />
        <PaperTear sheet="var(--graphite)" ground="var(--paper)" />
        <NoteWall seed={seed} />
      </>
    );
  }

  // the reels get a run of the pin to themselves, then the page comes away
  const rip = clamp01((progress - 0.3) / 0.36);
  // the notes go up behind it, finishing after the sheet has cleared
  const reveal = clamp01((progress - 0.4) / 0.34);
  // Starts past the left edge and ends past the right, so the jitter never
  // nicks the sheet before the tear begins or leaves a sliver at the end.
  const edge = -6 + rip * 113;

  return (
    <div ref={ref} className="relative h-[440vh]">
      <div className="sticky top-0 h-[100lvh] overflow-hidden bg-[color:var(--ink)]">
        <div className="absolute inset-0">
          <NoteWall inStage reveal={reveal} seed={seed} />
        </div>

        <div
          className="absolute inset-0"
          style={{
            clipPath: tearClip(edge),
            // the torn edge casts onto what it is uncovering — to its left now
            filter: rip > 0 ? "drop-shadow(-6px 0 18px rgba(0,0,0,0.5))" : undefined,
          }}
        >
          <ScreeningRoom reels={reels} inStage />
        </div>

        {/* shreds coming away with the torn edge */}
        {rip > 0.02 && rip < 0.98 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0"
            style={{ left: `${edge}%` }}
          >
            {[23, 52, 78].map((top, i) => (
              <span
                key={top}
                className="absolute block bg-[color:var(--paper)]"
                style={{
                  top: `${top}%`,
                  left: `${0.1 + i * 0.5}vw`,
                  width: `${1.1 + i * 0.35}vw`,
                  height: `${1.6 + i * 0.5}vh`,
                  opacity: 0.75 - i * 0.15,
                  transform: `rotate(${14 - i * 11}deg) translateX(${-rip * (8 + i * 6)}px)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
