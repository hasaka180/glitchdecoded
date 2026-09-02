"use client";

import { useEffect, useRef, useState } from "react";

import { useNarrow } from "@/lib/useNarrow";
import { useReducedMotion } from "@/lib/useReducedMotion";

import EditorsNote from "./EditorsNote";
import PaperTear from "./PaperTear";
import PerspectiveRail from "./PerspectiveRail";

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
 * width. Small jitter throughout with the occasional deeper nick — same shape
 * rule as a horizontal tear, turned on its side.
 */
const TEAR = (() => {
  const rand = mulberry32(19);
  const steps = 46;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const bite = rand() > 0.92 ? (0.8 + rand() * 1.6) * (rand() > 0.5 ? 1 : -1) : 0;
    return { y: (i / steps) * 100, dx: (rand() - 0.5) * 1.4 + bite };
  });
})();

/** Paper remaining, as a percentage of the width, cut with the torn edge. */
function tearClip(remaining: number) {
  const points = ["0% 0%"];
  for (const { y, dx } of TEAR) points.push(`${(remaining + dx).toFixed(2)}% ${y.toFixed(2)}%`);
  points.push("0% 100%");
  return `polygon(${points.join(", ")})`;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Pins the editor's note over the category rail and tears it away from the
 * right as you scroll, so the rail is uncovered rather than scrolled to.
 *
 * Below md — and under reduced motion — there is no pinning: the note runs at
 * its natural height, the horizontal PaperTear does the transition, and the
 * rail follows. A phone cannot hold the note's stacked layout in one viewport,
 * so pinning it would crop the copy.
 */
export default function RipStage() {
  const ref = useRef<HTMLDivElement | null>(null);
  const narrow = useNarrow(768);
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);

  const staged = !narrow && !reduced;

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
        <EditorsNote />
        <PaperTear />
        <PerspectiveRail />
      </>
    );
  }

  // the note plays out first, then the sheet tears away
  const noteApproach = clamp01(progress / 0.1);
  const noteProgress = clamp01((progress - 0.08) / 0.34);
  const rip = clamp01((progress - 0.5) / 0.28);
  // once the sheet is off, the remaining runway walks the rail to the right
  const railScroll = clamp01((progress - 0.8) / 0.19);
  // Starts past the right edge and ends past the left, so the jitter never
  // nicks the sheet before the tear begins or leaves a sliver at the end.
  const remaining = 105 - rip * 112;

  return (
    <div ref={ref} className="relative h-[540vh]">
      <div className="sticky top-0 h-[100lvh] overflow-hidden bg-[color:var(--graphite)]">
        <div className="absolute inset-0">
          <PerspectiveRail inStage scrollProgress={railScroll} />
        </div>

        <div
          className="absolute inset-0"
          style={{
            clipPath: tearClip(remaining),
            // the torn edge casts onto what it is uncovering
            filter: rip > 0 ? "drop-shadow(6px 0 18px rgba(0,0,0,0.5))" : undefined,
          }}
        >
          <EditorsNote drive={{ progress: noteProgress, approach: noteApproach }} />
        </div>

        {/* shreds coming away with the torn edge */}
        {rip > 0.02 && rip < 0.98 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0"
            style={{ left: `${remaining}%` }}
          >
            {[18, 44, 71].map((top, i) => (
              <span
                key={top}
                className="absolute block bg-[color:var(--paper)]"
                style={{
                  top: `${top}%`,
                  left: `${-1.2 - i * 0.5}vw`,
                  width: `${1.1 + i * 0.35}vw`,
                  height: `${1.6 + i * 0.5}vh`,
                  opacity: 0.75 - i * 0.15,
                  transform: `rotate(${-14 + i * 11}deg) translateX(${rip * (8 + i * 6)}px)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
