"use client";

import { useEffect, useRef, useState } from "react";

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

const W = 1440;
const BASE = 250;

/**
 * A torn edge: mostly straight, with constant small jitter and the occasional
 * deeper nick. Paper tears in fibres — the giveaway is a near-horizontal line
 * that is never quite horizontal, not a run of peaks.
 */
function tearEdge(seed: number, base: number) {
  const rand = mulberry32(seed);
  const points: string[] = [];
  let x = 0;
  while (x < W) {
    const run = 3 + rand() * 11;
    const jitter = (rand() - 0.5) * 6;
    // rare bite, either into the sheet or off it
    const bite = rand() > 0.965 ? (7 + rand() * 15) * (rand() > 0.5 ? 1 : -1) : 0;
    x += run;
    points.push(`L${x.toFixed(1)} ${(base + jitter + bite).toFixed(1)}`);
  }
  return points.join(" ");
}

const EDGE = tearEdge(7, BASE);
const FIBRE = tearEdge(31, BASE + 3);

export default function PaperTear() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = window.innerHeight + r.height;
      // 0 as the strip enters from the bottom, 1 once it has left the top
      setProgress(Math.min(1, Math.max(0, (window.innerHeight - r.top) / span)));
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
  }, []);

  // the sheet lifts away faster than the page scrolls, so the tear opens
  const lift = progress * 26;

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative h-[22vh] overflow-hidden bg-[color:var(--graphite)] sm:h-[30vh]"
    >
      <div
        className="absolute inset-x-0 top-0 will-change-transform"
        style={{ transform: `translate3d(0, ${-lift}%, 0)` }}
      >
        <svg
          viewBox={`0 0 ${W} 340`}
          preserveAspectRatio="none"
          className="block h-[22vh] w-full sm:h-[30vh]"
        >
          {/* the shadowed underside of the sheet, just proud of the edge */}
          <path
            d={`M0 0 L0 ${BASE + 3} ${FIBRE} L${W} 0 Z`}
            fill="color-mix(in srgb, var(--paper) 82%, #000)"
          />
          <path d={`M0 0 L0 ${BASE} ${EDGE} L${W} 0 Z`} fill="var(--paper)" />
        </svg>
      </div>

      {/* shreds left hanging in the gap */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 will-change-transform"
        style={{ transform: `translate3d(0, ${-lift * 0.55}%, 0)` }}
      >
        <svg
          viewBox={`0 0 ${W} 340`}
          preserveAspectRatio="none"
          className="block h-[22vh] w-full sm:h-[30vh]"
        >
          <path
            d={`M214 ${BASE + 1} l17 5 l-6 13 l-18 -7 Z`}
            fill="var(--paper)"
            opacity="0.75"
          />
          <path
            d={`M792 ${BASE + 4} l21 4 l-8 15 l-19 -6 Z`}
            fill="var(--paper)"
            opacity="0.6"
          />
          <path
            d={`M1206 ${BASE - 2} l13 8 l-9 11 l-12 -9 Z`}
            fill="var(--paper)"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
}
