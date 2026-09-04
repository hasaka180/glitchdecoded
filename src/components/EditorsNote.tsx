"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { useNarrow } from "@/lib/useNarrow";
import { useReducedMotion } from "@/lib/useReducedMotion";

const LINES = [
  "The world is loud.",
  "The obvious is everywhere.",
  "The important is often quiet.",
];

/** Characters carry a running index so the fill can run across all three lines. */
const TITLE = (() => {
  let index = 0;
  const lines = LINES.map((line) =>
    line.split(" ").map((word) => {
      const chars = [...word].map((char) => ({ char, index: index++ }));
      index++; // the space, so the wave keeps reading pace through it
      return chars;
    }),
  );
  return { lines, total: index };
})();

/** How many characters are in flight at once. */
const FLY_SOFTNESS = 6;
/** The title's top must rise above this fraction of the viewport to start. */
const FLY_START = 0.62;
/** …and the sequence runs out over this much more of the viewport. */
const FLY_SPAN = 0.52;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Ease so the travel settles rather than stopping dead. */
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

type Props = {
  /**
   * When set, a parent stage owns the scroll maths and this renders as a
   * plain full-height panel rather than carrying its own runway.
   */
  drive?: { progress: number; approach: number };
};

export default function EditorsNote({ drive }: Props = {}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLDivElement | null>(null);

  const narrow = useNarrow(768);
  const reduced = useReducedMotion();
  const [ownProgress, setOwnProgress] = useState(0);
  const [live, setLive] = useState(false);
  // how far the section has climbed the viewport — drives the writing
  const [ownApproach, setOwnApproach] = useState(0);
  // where the statement has to go, and how big it starts, to sit centred
  const [hero, setHero] = useState({ dx: 0, dy: 0, scale: 1 });

  const driven = !!drive;
  const staged = driven || (!narrow && !reduced);
  const progress = drive ? drive.progress : ownProgress;
  const approach = drive ? drive.approach : ownApproach;

  /**
   * Measure with the transform cleared: the element's laid-out box is its
   * resting place, and the centred opening is expressed as a delta from it.
   */
  const measure = useCallback(() => {
    const stage = stageRef.current;
    const script = scriptRef.current;
    if (!stage || !script) return;

    const previous = script.style.transform;
    script.style.transform = "none";
    const s = stage.getBoundingClientRect();
    const r = script.getBoundingClientRect();
    script.style.transform = previous;

    if (!r.width || !r.height || !s.width) return;
    setHero({
      dx: s.left + s.width / 2 - (r.left + r.width / 2),
      dy: s.top + s.height / 2 - (r.top + r.height / 2),
      // constrained by both axes, or six lines of script run off the screen
      scale: Math.min(2.9, (s.width * 0.66) / r.width, (s.height * 0.82) / r.height),
    });
  }, []);

  // Without a scroll runway the sequence runs on a timer instead, kicked off
  // when the section comes into view.
  useEffect(() => {
    if (staged || driven) return;
    const section = sectionRef.current;
    if (!section) return;
    if (typeof IntersectionObserver === "undefined") {
      // no observer: reveal on the next frame rather than synchronously here
      const id = requestAnimationFrame(() => setLive(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setLive(true);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [staged, driven]);

  // Measuring still has to happen when driven, but the scroll maths does not.
  useEffect(() => {
    if (!driven) return;
    let raf = 0;
    const request = () => {
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };
    request();
    window.addEventListener("resize", request);
    const ro = new ResizeObserver(request);
    if (scriptRef.current) ro.observe(scriptRef.current);
    document.fonts?.ready?.then(request);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", request);
      ro.disconnect();
    };
  }, [driven, measure]);

  useEffect(() => {
    if (!staged || driven) return;
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    let remeasure = true;

    // all reads and state writes happen inside the frame callback, never
    // synchronously in the effect body
    const progressOf = (rect: DOMRect) => {
      const runway = rect.height - window.innerHeight;
      return runway > 0 ? clamp01(-rect.top / runway) : 1;
    };

    const read = () => {
      raf = 0;
      if (remeasure) {
        remeasure = false;
        measure();
      }
      const r = section.getBoundingClientRect();
      setOwnProgress(progressOf(r));
      // Keyed to the title itself, not the section, and held back until it is
      // properly on screen: nothing moves while its top is below FLY_START of
      // the viewport, and the sequence finishes FLY_SPAN later. Starting it at
      // the viewport edge meant the first lines had already settled by the
      // time they were readable.
      const title = scriptRef.current?.getBoundingClientRect();
      const top = title ? title.top : r.top;
      const h = window.innerHeight;
      const rising = clamp01((h * FLY_START - top) / (h * FLY_SPAN));
      // Once the section pins, the title stops rising and `rising` freezes
      // wherever it got to — so the first slice of the runway finishes the
      // sequence, well before the travel starts at 0.08.
      const pinned = clamp01(progressOf(r) / 0.06);
      setOwnApproach(Math.max(rising, pinned));
    };
    const request = (withMeasure = false) => {
      if (withMeasure) remeasure = true;
      if (!raf) raf = requestAnimationFrame(read);
    };

    const onScroll = () => request();
    const onResize = () => request(true);

    request(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(section);
    // the hand is a local OTF: its metrics land after first paint, and the
    // centring maths is only right once the real face is in
    if (scriptRef.current) ro.observe(scriptRef.current);
    document.fonts?.ready?.then(() => request(true));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [staged, driven, measure]);

  // 0 → statement centred and large; 1 → statement resting in column one
  const travel = staged ? ease(clamp01((progress - 0.08) / 0.42)) : 1;
  // the rest of the spread arrives only once the statement has moved
  const arrive = staged ? clamp01((progress - 0.46) / 0.3) : 1;

  const at = (start: number) => clamp01((arrive - start) / (1 - start || 1));

  /**
   * How far a character has flown in: 0 is dropped and invisible, 1 is settled.
   * Scrubbed off scroll when there is a runway, otherwise driven by the
   * transition and the per-character delay below.
   */
  const flown = (index: number) => {
    if (!staged) return live ? 1 : 0;
    const head = (approach / 0.85) * (TITLE.total + FLY_SOFTNESS);
    return clamp01((head - index) / FLY_SOFTNESS);
  };

  /**
   * Blocks arrive after the title. Desktop scrubs them off the pinned runway;
   * below md they follow the title on a delay, so the order reads title →
   * illustration → prose either way.
   */
  const appear = (start: number, mobileDelay: number): CSSProperties => {
    const t = staged ? at(start) : live ? 1 : 0;
    return {
      opacity: t,
      transform: `translateY(${(1 - t) * 14}px)`,
      transitionDelay: staged ? undefined : `${mobileDelay}s`,
    };
  };

  return (
    <section
      ref={sectionRef}
      id="note"
      className={`paper relative isolate scroll-mt-20 text-[color:var(--ink-brown)] ${
        driven
          ? "flex h-full items-center px-5 sm:px-10"
          : staged
            ? "h-[280vh]"
            : "flex min-h-[100lvh] items-center px-5 pt-28 pb-20 sm:px-10"
      }`}
    >
      <div
        ref={stageRef}
        className={
          driven
            ? "w-full"
            : staged
              ? "sticky top-0 flex h-[100lvh] items-center overflow-hidden px-5 sm:px-10"
              : "fly-timed w-full"
        }
      >
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-10 md:grid-cols-[auto_auto_auto] md:justify-center md:gap-12 lg:gap-16">
          {/* 1 — the hand. Starts centred and oversized, then travels here. */}
          <div
            ref={scriptRef}
            className="md:w-max"
            style={{
              transform: `translate3d(${hero.dx * (1 - travel)}px, ${
                hero.dy * (1 - travel)
              }px, 0) scale(${1 + (hero.scale - 1) * (1 - travel)})`,
              transformOrigin: "center center",
              willChange: "transform",
            }}
          >
            <div style={appear(0, 0)} className="fly-block">
              <p className="mb-7 font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">
                Editor&rsquo;s note
              </p>
            </div>

            <h2 className="font-pixel text-[clamp(1.5rem,3.1vw,2.5rem)] leading-[1.15] text-[color:var(--script-red)] md:whitespace-nowrap">
              {TITLE.lines.map((words, line) => (
                <div key={line}>
                  {words.map((chars, word) => (
                    <span key={word} className="inline-block whitespace-nowrap">
                      {chars.map(({ char, index }) => {
                        const t = flown(index);
                        return (
                          <span
                            key={index}
                            className="fly-char"
                            style={{
                              opacity: t,
                              transform: `translate3d(0, ${(1 - t) * 0.5}em, 0) rotate(${
                                (1 - t) * -7
                              }deg)`,
                              transitionDelay: staged ? undefined : `${0.35 + index * 0.028}s`,
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                      {word < words.length - 1 ? "\u00A0" : null}
                    </span>
                  ))}
                </div>
              ))}
            </h2>
          </div>

          {/* 2 — the shelter, at full strength: the still point the two columns
              of type are talking about.
              A plain <img> on purpose — the file carries its own CSS keyframes,
              and the image optimiser would strip or rasterise them. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/umbrella-animated.svg"
            alt="Two figures sheltering under one umbrella in the rain"
            style={appear(0.1, 1.15)}
            className="fly-block mx-auto w-full max-w-[230px] self-center sm:max-w-[300px] md:w-[clamp(220px,22vw,330px)] md:max-w-none"
          />

          {/* 3 — the prose */}
          <div className="max-w-[38ch] font-garamond text-[clamp(0.95rem,1.05vw,1.1rem)] leading-[1.6]">
            <div style={appear(0.18, 1.5)} className="fly-block mb-6">
              <span className="block font-arial text-[0.75em] font-bold tracking-[0.06em] uppercase">
                We live inside weather —
              </span>
              <span className="block italic">information, opinion, noise.</span>
            </div>

            <div style={appear(0.3, 1.65)} className="fly-block mb-6">
              Somewhere in the din of it
              <br />
              we stopped noticing what was standing
              <br />
              in plain sight.
            </div>

            <div style={appear(0.42, 1.8)} className="fly-block mb-6">
              Glitch Decoded exists to slow the world down.
            </div>

            <div style={appear(0.54, 1.95)} className="fly-block mb-6">
              To question what looks settled.
              <br />
              To linger where the scroll hurries past.
            </div>

            <div style={appear(0.66, 2.1)} className="fly-block mb-8">
              And now and then, to say{" "}
              <span className="italic">the world is not</span> as hopeless as it
              sounds.
            </div>

            <div style={appear(0.78, 2.25)} className="fly-block">
              <Link
                href="/about#manifesto"
                className="group inline-flex items-center gap-3 border-b border-current pb-1 font-arial text-[10px] font-bold tracking-[0.2em] uppercase"
              >
                Read our manifesto
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
