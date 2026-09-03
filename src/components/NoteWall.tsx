"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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
 * There is no server behind this — a note the reader pins is kept in their own
 * browser, and the copy says so rather than implying it was posted anywhere.
 */
type Note = {
  id: string;
  /** The note itself, in the second person, the way people write to themselves. */
  text: string;
  /** How it was signed. Initials, a first name, a time — whatever was given. */
  sign: string;
  /** Written by this reader, on this device. */
  mine?: boolean;
};

const SEED: Note[] = [
  { id: "s1", text: "Stop rehearsing conversations that are never going to happen.", sign: "M.K. · Lisbon" },
  { id: "s2", text: "The thing you keep postponing is the thing.", sign: "anon · 03:14" },
  { id: "s3", text: "You are allowed to change your mind in public.", sign: "R. · Colombo" },
  { id: "s4", text: "Call your father. Not on his birthday.", sign: "T.A. · Leeds" },
  { id: "s5", text: "Busy is not the same as useful. Check which one today was.", sign: "J." },
  { id: "s6", text: "Nobody is thinking about it as much as you are.", sign: "anon" },
  { id: "s7", text: "Leave the phone in the other room. That is the whole plan.", sign: "D.V. · Berlin" },
];

const KEY = "glitch:notes-to-self";
const LIMIT = 140;
/** How many of the reader's own notes are kept. */
const KEEP = 24;
/** Notes on the board at once. The rail shows four of them and turns. */
const RING = 6;
/** How long a card sits before the rail steps on, and how long the step takes. */
const DWELL = 3800;
const SLIDE = 700;
/**
 * The reader's own notes, read straight out of localStorage.
 *
 * Through useSyncExternalStore rather than state seeded in an effect: the
 * server has no store, so a lazy initialiser would make the first client
 * render disagree with the server HTML. The snapshot is cached against the raw
 * string so it stays referentially stable between reads — re-parsing on every
 * call would loop React forever.
 */
const EMPTY: Note[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedNotes: Note[] = EMPTY;

function rawNotes(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    // private mode, or a store the browser has blocked
    return null;
  }
}

function parseNotes(raw: string | null): Note[] {
  if (!raw) return EMPTY;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved)) return EMPTY;
    return saved
      .filter(
        (n): n is Note =>
          !!n && typeof n === "object" && typeof (n as Note).text === "string",
      )
      .map((n) => ({ ...n, mine: true }));
  } catch {
    // a corrupt store just means an empty board
    return EMPTY;
  }
}

function readNotes(): Note[] {
  const raw = rawNotes();
  if (raw === cachedRaw) return cachedNotes;
  cachedRaw = raw;
  cachedNotes = parseNotes(raw);
  return cachedNotes;
}

function writeNotes(next: Note[]) {
  const raw = JSON.stringify(next);
  let stored = false;
  try {
    window.localStorage.setItem(KEY, raw);
    stored = true;
  } catch {
    // the note still shows for this visit, it just will not survive a reload
  }
  // Keep the cache agreeing with what the store actually holds, or the very
  // next read would throw the note away again.
  cachedRaw = stored ? raw : rawNotes();
  cachedNotes = next;
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // another tab of the same site pinning a note
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

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
};

export default function NoteWall({ inStage = false, reveal = 1 }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const fieldRef = useRef<HTMLTextAreaElement | null>(null);

  const mine = useSyncExternalStore(subscribe, readNotes, () => EMPTY);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sign, setSign] = useState("");
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

  // Autoplay. Held while the reader is on the rail or writing, and off
  // entirely under reduced motion, where the rail scrolls by hand instead.
  const paused = held || open || reduced;
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setStep((n) => n + 1), DWELL);
    return () => clearInterval(id);
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    fieldRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pin = useCallback(() => {
    const body = text.trim();
    if (!body) return;
    const note: Note = {
      id: `m${Date.now()}`,
      text: body.slice(0, LIMIT),
      sign: sign.trim().slice(0, 24) || "anon",
      mine: true,
    };
    writeNotes([note, ...readNotes()].slice(0, KEEP));
    setText("");
    setSign("");
    setOpen(false);
  }, [text, sign]);

  const notes = [...mine, ...SEED].slice(0, RING);
  /** A second lap of the same notes, so the rail can turn without a seam. */
  const track = [...notes, ...notes];

  /** 0 → the note has not been pinned up yet, 1 → it has settled. */
  const at = (i: number) => {
    if (!inStage) return live ? 1 : 0;
    return clamp01((reveal * (RING + 3) - i) / 3);
  };

  const card = (note: Note, i: number, copy: number) => {
    const t = at(i);
    const slot = SLOT[i];
    return (
      <li
        key={`${note.id}-${copy}`}
        aria-hidden={copy > 0}
        className={`note-card shrink-0 px-2.5 ${inStage ? "" : "note-timed"}`}
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
          {/* The art runs the whole card, off the same six-frame strip the
              category rail animates. */}
          <span
            aria-hidden
            className="card-sprite absolute inset-0"
            style={{ backgroundImage: `url(${slot.art})` }}
          />
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
              {note.mine && (
                <span style={{ color: slot.hue }} className="opacity-90">
                  · yours
                </span>
              )}
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
          <div>
            <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
              The board
            </p>
            <h2 className="mt-4 font-pixel text-[26px] leading-[1.15] tracking-[0.02em] text-[color:var(--script-red)] uppercase sm:text-[42px]">
              Note to self
            </h2>
          </div>

          <div className="flex items-end gap-8">
            <p className="hidden max-w-[32ch] font-garamond text-[15px] leading-[1.55] opacity-70 sm:block sm:text-[17px]">
              Notes readers left themselves on the way out. Pin one of your own —
              it stays in this browser, on this device, and goes nowhere else.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="pixel-corner-sm shrink-0 cursor-pointer bg-[color:var(--script-red)] px-5 py-3 font-arial text-[10px] font-bold tracking-[0.2em] text-[color:var(--paper)] uppercase transition-opacity hover:opacity-85"
            >
              Write one →
            </button>
          </div>
        </div>

        {/* The rail. Four slots wide on a desktop, two on a tablet, one on a
            phone — the track always carries twelve cards, so a slot is a
            twelfth of it whatever the count, and the step is the same sum at
            every width. Gutters are the cards' own padding rather than a flex
            gap, or that arithmetic stops holding. */}
        <div
          className="note-rail relative mx-auto -my-3 w-full max-w-[1200px] overflow-hidden px-2.5 py-3 sm:px-7"
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
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
                    transition: snapping ? "none" : `transform ${SLIDE}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                  }
            }
          >
            {reduced
              ? notes.map((note, i) => card(note, i, 0))
              : track.map((note, i) => card(note, i % RING, Math.floor(i / RING)))}
          </ul>
        </div>

        <p className="mx-auto mt-8 w-full max-w-[1200px] px-5 font-garamond text-[15px] leading-[1.55] opacity-70 sm:hidden sm:px-10">
          Notes readers left themselves on the way out. Pin one of your own — it
          stays in this browser, on this device, and goes nowhere else.
        </p>
      </div>

      {/* The composer is fixed to the viewport rather than laid into the board:
          inside the tear stage the board is pinned to the scroll position, and
          a form that moved while it was being typed into would be unusable. */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--ink)]/70 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Write a note to yourself"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="paper ruled pixel-corner w-full max-w-[560px] p-6 text-[color:var(--ink-brown)] shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:p-8">
            <div className="mb-5 flex items-baseline justify-between gap-4">
              <p className="font-pixel text-[20px] leading-[1.1] tracking-[0.02em] text-[color:var(--script-red)] uppercase sm:text-[24px]">
                Note to self
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer font-arial text-[10px] font-bold tracking-[0.2em] uppercase opacity-50 transition-opacity hover:opacity-100"
              >
                Close
              </button>
            </div>

            <textarea
              ref={fieldRef}
              value={text}
              maxLength={LIMIT}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Whatever you would want to read back on a bad Tuesday."
              className="w-full resize-none bg-transparent font-garamond text-[1.25rem] leading-[1.5] outline-none placeholder:opacity-35"
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--ink-brown)]/20 pt-4">
              <input
                value={sign}
                maxLength={24}
                onChange={(e) => setSign(e.target.value)}
                placeholder="Sign it — initials, a city, nothing"
                className="min-w-0 flex-1 bg-transparent font-arial text-[10px] font-bold tracking-[0.18em] uppercase outline-none placeholder:opacity-35"
              />
              <span className="font-arial text-[10px] tracking-[0.18em] tabular-nums opacity-40">
                {LIMIT - text.length}
              </span>
              <button
                type="button"
                onClick={pin}
                disabled={!text.trim()}
                className="pixel-corner-sm cursor-pointer bg-[color:var(--script-red)] px-5 py-3 font-arial text-[10px] font-bold tracking-[0.2em] text-[color:var(--paper)] uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
              >
                Pin it
              </button>
            </div>

            <p className="mt-4 font-arial text-[9px] tracking-[0.18em] uppercase opacity-40">
              Kept on this device only
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
