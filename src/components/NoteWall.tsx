"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SEED, type Note } from "@/lib/notes/seed";

import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * The board the torn page opens onto: six notes people wrote to themselves, on
 * a rail that shows four at a time and turns on its own.
 *
 * Same stock as the editor's note — this is the other end of the same
 * conversation, so it is printed on the same page rather than given a ground
 * of its own. Each note carries a band of the category art, animated off the
 * same six-frame strips the category rail runs on.
 *
 * The notes are the magazine's, edited at the desk. The board used to let a
 * reader pin one into their own browser; it is editorial now, and "Write one"
 * goes to the desk — which sends anyone not signed in to the sign-in page.
 */


/** Notes on the board at once. The rail shows four of them and turns. */
const RING = 6;
/** How long a card sits before the rail steps on, and how long the step takes. */
const DWELL = 3800;
const SLIDE = 700;

/**
 * What a slot on the board looks like: the art the note is written over, the
 * accent it is pinned with, and the ground that art burns onto.
 *
 * Fixed per slot rather than random — the board has to render identically on
 * the server and on the client, and a note keeps its face when another one is
 * pinned ahead of it. The art and hues are the category rail's, so a note
 * belongs to the same world as the pieces it was written next to.
 */
const SLOT = [
  { art: "/assets/categories/unpopular.png", hue: "#e8d24a", from: "#3a3324", to: "#0b0a08" },
  { art: "/assets/categories/untold.png", hue: "#4fd0e0", from: "#13323f", to: "#050f16" },
  { art: "/assets/categories/reality-check.png", hue: "#e08a3c", from: "#43301c", to: "#120c06" },
  { art: "/assets/categories/deep-dives.png", hue: "#a98cf0", from: "#241f3d", to: "#0a0813" },
  { art: "/assets/categories/nature.png", hue: "#8fce5a", from: "#22341d", to: "#080d06" },
  { art: "/assets/categories/human.png", hue: "#6fa8ef", from: "#1d2a3d", to: "#070b11" },
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

type Props = {
  /** Rendered inside the tear stage, sized to one viewport rather than flowing. */
  inStage?: boolean;
  /** 0 → nothing pinned yet, 1 → the whole board is up. Stage-driven. */
  reveal?: number;
  /**
   * How the board is laid out. The home page turns a rail, because the board is
   * one section of a scroll and a rail says "there is more of this". The notes
   * page is the board itself, so it lays every note out at once — a reader who
   * came to look at the board should not have to wait for it to come round.
   */
  layout?: "rail" | "grid";
  /**
   * The section's own heading. Off where a masthead already carries it, so the
   * notes page does not print "note to self" twice.
   */
  heading?: boolean;  /** The magazine's own notes, from the desk. */
  seed?: Note[];
};

export default function NoteWall({
  inStage = false,
  reveal = 1,
  layout = "rail",
  heading = true,
  // The desk's board when there is one. Defaults to the file so the component
  // still renders on its own — in a test, or anywhere it is dropped in.
  seed = SEED,
}: Props) {
  const grid = layout === "grid";
  const sectionRef = useRef<HTMLElement | null>(null);
  const [live, setLive] = useState(false);

  const reduced = useReducedMotion();
  // The rail's position, counted in cards rather than pixels, and allowed to
  // run past the ring — the track carries a second copy, so stepping off the
  // end lands on an identical card and the jump back is invisible.
  const [step, setStep] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const [held, setHeld] = useState(false);

  // Without a stage driving it, the board settles in when it comes into view.
  useEffect(() => {
    if (inStage) return;
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setLive(true);
      return;
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
    io.observe(el);
    return () => io.disconnect();
  }, [inStage]);

  // Autoplay. Held while the reader is on the rail, and off entirely under
  // reduced motion, where the rail scrolls by hand instead.
  //
  // Driven off requestAnimationFrame against a wall clock rather than
  // setInterval: iOS Safari throttles timers during momentum scrolling and in
  // Low Power Mode, and suspends them outright while the tab is in the
  // background — a rail on setInterval comes back from that either stalled or
  // owing a burst of missed steps. Measuring elapsed time means a stall costs
  // one step, not a queue of them, and rAF stops and restarts with the page.
  const paused = held || reduced || grid;
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < DWELL) return;
      last = now;
      setStep((n) => n + 1);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  // One card past the ring is the same card the rail started on, so once the
  // slide has played out the position is reset with the transition switched
  // off and nothing appears to move.
  useEffect(() => {
    if (step < RING) return;
    const id = setTimeout(() => {
      setSnapping(true);
      setStep(0);
    }, SLIDE);
    return () => clearTimeout(id);
  }, [step]);

  useEffect(() => {
    if (!snapping) return;
    // two frames: the reset has to have been painted before the transition is
    // put back, or the browser animates the jump it was meant to hide
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSnapping(false));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [snapping]);

  // The rail is a fixed ring so its arithmetic holds; the grid shows the lot.
  const notes = grid ? seed : seed.slice(0, RING);
  /** A second lap of the same notes, so the rail can turn without a seam. */
  const track = [...notes, ...notes];

  /** 0 → the note has not been pinned up yet, 1 → it has settled. */
  const at = (i: number) => {
    if (!inStage) return live ? 1 : 0;
    return clamp01((reveal * (RING + 3) - i) / 3);
  };

  const card = (note: Note, i: number, copy: number) => {
    const t = at(i);
    const slot = SLOT[i % SLOT.length];
    return (
      <li
        key={`${note.id}-${copy}`}
        aria-hidden={copy > 0}
        className={`note-card ${grid ? "" : "shrink-0 px-2.5"} ${
          inStage ? "" : "note-timed"
        }`}
        style={{
          opacity: t,
          transform: `translate3d(0, ${(1 - t) * 26}px, 0)`,
          transitionDelay: inStage ? undefined : `${i * 0.07}s`,
        }}
      >
        <article
          className="pixel-corner relative flex h-full min-h-[16rem] flex-col justify-end overflow-hidden p-5 text-[color:var(--bone)]"
          style={{ backgroundImage: `linear-gradient(160deg, ${slot.from}, ${slot.to})` }}
        >
          {/* A picture the desk put on the note is a real image with a
              description, because it was chosen to say something. The category
              art behind the rest is decoration and stays a background. */}
          {note.image ? (
            // An Appwrite Storage URL on whatever endpoint the project is on,
            // which next/image would need configured as a remote host.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={note.image.url}
              alt={note.image.alt}
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span
              aria-hidden
              className="card-sprite absolute inset-0"
              style={{ backgroundImage: `url(${slot.art})` }}
            />
          )}
          {/* …and darkens under the hand, so the note reads over whatever the
              art happens to be doing there. */}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${slot.to}99 0%, ${slot.to}33 30%, ${slot.to}cc 62%, ${slot.to}f5 100%)`,
            }}
          />
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ backgroundColor: slot.hue }}
          />
          {/* the pin goes through the art, the way it would through paper */}
          <span
            aria-hidden
            className="absolute top-4 left-1/2 block h-[9px] w-[9px] -translate-x-1/2"
            style={{ backgroundColor: slot.hue, boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.45)" }}
          />

          <div className="relative">
            <p className="font-garamond text-[clamp(1.05rem,1.3vw,1.3rem)] leading-[1.45]">
              {note.text}
            </p>
            <p className="mt-4 flex items-center gap-2 font-arial text-[9px] font-bold tracking-[0.18em] uppercase opacity-60">
              {note.sign}
            </p>
          </div>
        </article>
      </li>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="note-to-self"
      className={`paper relative overflow-hidden text-[color:var(--ink-brown)] ${
        inStage ? "flex h-full items-center" : "py-20 sm:py-28"
      }`}
    >
      <div className="w-full">
        <div className="mx-auto mb-8 flex w-full max-w-[1200px] flex-wrap items-end justify-between gap-5 px-5 sm:mb-12 sm:px-10">
          {heading ? (
            <div>
              <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
                The board
              </p>
              <h2 className="mt-4 font-pixel text-[26px] leading-[1.15] tracking-[0.02em] text-[color:var(--script-red)] uppercase sm:text-[42px]">
                Note to self
              </h2>
            </div>
          ) : (
            <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
              {notes.length} pinned
            </p>
          )}

          <div className="flex items-end gap-8">
            <p
              className={`max-w-[32ch] font-garamond text-[15px] leading-[1.55] opacity-70 sm:text-[17px] ${
                heading ? "hidden sm:block" : "hidden"
              }`}
            >
Notes left on the way out, for whoever is reading on a bad
              Tuesday. Written at the desk and pinned here.
            </p>
            {/* Straight to the desk. Signed out, that route sends you to sign
                in and back again; it costs this page nothing, where reading the
                session here would make the whole front page render per request. */}
            <Link
              href="/dashboard/notes"
              className="pixel-corner-sm shrink-0 cursor-pointer bg-[color:var(--script-red)] px-5 py-3 font-arial text-[10px] font-bold tracking-[0.2em] text-[color:var(--paper)] uppercase transition-opacity hover:opacity-85"
            >
              Write one →
            </Link>
          </div>
        </div>

        {grid ? (
          /* Every note at once. The same card the rail turns — only the box
             around it changes, so the two layouts cannot drift apart. */
          <ul className="mx-auto grid w-full max-w-[1200px] gap-5 px-5 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
            {notes.map((note, i) => card(note, i, 0))}
          </ul>
        ) : (
          /* The rail. Four slots wide on a desktop, two on a tablet, one on a
             phone — the track always carries twelve cards, so a slot is a
             twelfth of it whatever the count, and the step is the same sum at
             every width. Gutters are the cards' own padding rather than a flex
             gap, or that arithmetic stops holding. */
          <div
            className="note-rail relative mx-auto -my-3 w-full max-w-[1200px] overflow-hidden px-2.5 py-3 sm:px-7"
            // Pointer events rather than mouse ones, and never a hold from a
            // touch: iOS Safari answers a tap with a synthetic mouseenter and
            // then never sends the matching mouseleave, so a mouse-driven hold
            // would stop the rail on first contact and never let it go. A
            // leave of any kind still releases, so a hybrid device that
            // switched pointers mid-hover cannot latch either.
            onPointerEnter={(e) => {
              if (e.pointerType !== "touch") setHeld(true);
            }}
            onPointerLeave={() => setHeld(false)}
            onFocusCapture={() => setHeld(true)}
            onBlurCapture={() => setHeld(false)}
          >
            <ul
              className={`flex items-stretch ${
                reduced
                  ? "note-rail-static scrollbar-none snap-x snap-mandatory overflow-x-auto"
                  : "note-rail-track"
              }`}
              style={
                reduced
                  ? undefined
                  : {
                      transform: `translate3d(calc(${-step} * 100% / 12), 0, 0)`,
                      transition: snapping
                        ? "none"
                        : `transform ${SLIDE}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    }
              }
            >
              {reduced
                ? notes.map((note, i) => card(note, i, 0))
                : track.map((note, i) => card(note, i % RING, Math.floor(i / RING)))}
            </ul>
          </div>
        )}

        {heading && (
          <p className="mx-auto mt-8 w-full max-w-[1200px] px-5 font-garamond text-[15px] leading-[1.55] opacity-70 sm:hidden sm:px-10">
            Notes left on the way out, for whoever is reading on a bad
            Tuesday. Written at the desk and pinned here.
          </p>
        )}
      </div>

    </section>
  );
}
