"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { type Reel, embedSrc, thumbnailSrc, youtubeId } from "@/lib/videos";

/**
 * Archive footage of philosophers talking about the mind, on the same graphite
 * ground as the picks above — printed on stock this time, because this is the
 * page that gets torn off to open the note board below it.
 *
 * The set is the one dark object in the section: a
 * CRT with scanlines, a roll bar and untuned static over a sepia title card,
 * and changing reel snaps the tube to static for a beat before the next card
 * lands. Beside it the reels are listed like a printed programme.
 *
 * The reels are the desk's, the same ones the video library plays, so a link
 * pasted on /dashboard/reels reaches both. A reel with a link shows its own
 * still and can be played here; one without keeps its title card and reads as
 * untransferred, which is the honest state for an archive nobody has digitised.
 */
/** Untuned snow. Also the whole picture for the beat after a channel change. */
function Static({ opacity }: { opacity: number }) {
  return (
    <span
      aria-hidden
      className="crt-static pointer-events-none absolute inset-0 transition-opacity duration-200"
      style={{ opacity, mixBlendMode: "screen" }}
    />
  );
}

/** Scanlines, roll bar and vignette — the parts of the tube that never change. */
function Tube() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.42) 0px, rgba(0,0,0,0.42) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[18%] opacity-[0.07]">
        <span className="crt-roll absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent" />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 42%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.9) 100%)",
        }}
      />
    </>
  );
}

/** The card the tube holds while a reel is selected but not running. */
function TitleCard({ reel, index }: { reel: Reel; index: number }) {
  return (
    <span
      className="crt-flicker absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
      style={{ color: reel.hue }}
    >
      <span className="relative font-arial text-[9px] font-bold tracking-[0.42em] uppercase opacity-60 sm:text-[10px]">
        Reel {String(index + 1).padStart(2, "0")}
      </span>
      <span className="relative mt-4 font-garamond text-[34px] leading-[1.05] font-semibold sm:text-[56px]">
        {reel.speaker}
      </span>
      <span
        aria-hidden
        className="relative mt-5 block h-px w-16 opacity-50"
        style={{ backgroundColor: reel.hue }}
      />
      <span className="relative mt-5 max-w-[34ch] font-garamond text-[15px] leading-[1.5] italic opacity-75 sm:text-[18px]">
        {reel.line}
      </span>
      <span className="relative mt-6 font-arial text-[9px] font-bold tracking-[0.28em] uppercase opacity-50">
        {reel.source} · {reel.year}
      </span>
    </span>
  );
}

/** The reel's own frame, cropped to fill so YouTube's pillarbox never prints
    inside a tube that has its own. */
function Still({ id }: { id: string }) {
  return (
    // A YouTube still on whatever host the CDN serves; next/image would need
    // it configured as a remote host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={thumbnailSrc(id)}
      alt=""
      className="absolute inset-0 size-full object-cover"
    />
  );
}

/** Small counts read as words here; anything larger falls back to digits. */
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven",
  "eight", "nine", "ten", "eleven", "twelve"];

/**
 * `inStage` is the torn-page role: the section is pinned to one viewport by
 * NoteRip and clipped to the tear, so it drops its section break, tightens its
 * rhythm and caps the picture against the viewport's height instead of running
 * at its natural length.
 */
export default function ScreeningRoom({
  reels,
  inStage = false,
}: {
  reels: Reel[];
  inStage?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [tuning, setTuning] = useState(false);
  const [playing, setPlaying] = useState(false);
  // The desk can shorten the programme between renders, so the index is
  // read defensively rather than trusted to still point at a reel.
  const reel = reels[current] ?? reels[0];
  const id = reel ? youtubeId(reel.url) : null;

  /* The static burst on a channel change. Cleared on unmount so a fast run
     through the rail can't leave the tube stuck on snow. */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const select = (i: number) => {
    if (i === current) return;
    if (timer.current) clearTimeout(timer.current);
    setPlaying(false);
    setTuning(true);
    setCurrent(i);
    timer.current = setTimeout(() => setTuning(false), 260);
  };

  // An empty table would otherwise render a set with no picture in it.
  if (!reel) return null;

  // The count and the span were printed as "Six broadcasts between 1958 and
  // 1974" — true when the reels lived in this file, and a lie the first time
  // somebody adds one at the desk.
  const years = reels
    .map((r) => Number.parseInt(r.year, 10))
    .filter((y) => Number.isFinite(y));
  const span = years.length
    ? Math.min(...years) === Math.max(...years)
      ? ` from ${Math.min(...years)}`
      : ` between ${Math.min(...years)} and ${Math.max(...years)}`
    : "";
  const count = WORDS[reels.length] ?? String(reels.length);
  const standfirst =
    `${count.charAt(0).toUpperCase()}${count.slice(1)} broadcast` +
    `${reels.length === 1 ? "" : "s"}${span}, in which people who thought for ` +
    "a living were asked, on camera, how to bear being alive.";

  return (
    <section
      id="screening"
      className={`stock relative overflow-hidden bg-[color:var(--graphite)] text-[color:var(--ink)] ${
        inStage
          ? "stage-tight flex h-full items-center py-6"
          : "pt-14 pb-20 sm:pt-20 sm:pb-28"
      }`}
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-10">
        {/* Same ground as the picks above, so the break is marked the way that
            section marks its own — the nav's broken signal bar. Pinned as the
            torn page, there is no break above it to mark. */}
        <div aria-hidden className={`mb-10 flex h-px w-full sm:mb-14 ${inStage ? "hidden" : ""}`}>
          <span className="h-full flex-[2] bg-[color:var(--ink)]/30" />
          <span className="h-full flex-[1]" />
          <span className="h-full flex-[6] bg-[color:var(--ink)]/12" />
          <span className="h-full flex-[1]" />
          <span className="h-full flex-[3] bg-[color:var(--ink)]/25" />
        </div>

        <header
          className={`reel-head flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10 ${
            inStage ? "mb-6" : "mb-10 sm:mb-14"
          }`}
        >
          <div>
            <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
              The film archive
            </p>
            <h2 className="mt-4 font-pixel text-[26px] leading-[1.15] tracking-[0.02em] uppercase sm:text-[42px]">
              Old men, old tape, live wounds
            </h2>
          </div>
          <p className="max-w-[34ch] font-garamond text-[16px] leading-[1.5] opacity-70 sm:text-right">
            {standfirst}
          </p>
        </header>

        {/* minmax(0,…) on both tracks, never a bare `auto` or `fr`. A grid
            track's automatic minimum is its content's, so the rail of cans
            below — six fixed-width cards on one row — sized the column to its
            own max-content and dragged the set out to three times the screen
            with it. `overflow-x: auto` lets that rail scroll, but it does not
            stop a track from measuring it. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-8">
          {/* The set: cabinet, perforated edges, picture. */}
          <div className="reel-set pixel-corner relative bg-black p-3 text-[color:var(--bone)] sm:p-4">
            <span aria-hidden className="sprockets absolute inset-y-4 left-[6px] w-[6px] opacity-40" />
            <span aria-hidden className="sprockets absolute inset-y-4 right-[6px] w-[6px] opacity-40" />

            <div className="relative mx-[10px] overflow-hidden rounded-[10px] bg-black">
              <div
                className={`reel-pic relative aspect-[16/10] w-full ${inStage ? "max-h-[46lvh]" : ""}`}
              >
                {playing && id ? (
                  <iframe
                    key={reel.id}
                    className="absolute inset-0 size-full"
                    src={embedSrc(id)}
                    title={`${reel.speaker} — ${reel.source}, ${reel.year}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : id ? (
                  <Still id={id} />
                ) : (
                  <TitleCard reel={reel} index={current} />
                )}

                <Static opacity={tuning ? 0.9 : 0.07} />
                <Tube />

                {/* Corner marker, the way a broadcast stamps its own picture. */}
                <span className="pointer-events-none absolute top-3 left-4 flex items-center gap-2 font-arial text-[9px] font-bold tracking-[0.24em] uppercase opacity-55 sm:top-4 sm:left-5">
                  <span aria-hidden className="size-1.5 bg-[color:var(--red)]" />
                  Archive
                </span>
                <span className="pointer-events-none absolute top-3 right-4 font-arial text-[9px] font-bold tracking-[0.24em] uppercase opacity-45 sm:top-4 sm:right-5">
                  {reel.year}
                </span>
              </div>
            </div>

            {/* Transport strip — what is loaded, and whether it can run. */}
            <div className="mx-[10px] mt-3 flex items-center justify-between gap-4 sm:mt-4">
              <span className="min-w-0">
                <span className="block truncate font-pixel text-[12px] tracking-[0.02em] uppercase" style={{ color: reel.hue }}>
                  {reel.speaker}
                </span>
                <span className="mt-1 block truncate font-arial text-[9px] font-bold tracking-[0.2em] uppercase opacity-45">
                  {reel.source} · {reel.stock}
                </span>
              </span>

              {id ? (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="pixel-corner-sm flex shrink-0 cursor-pointer items-center gap-2 bg-white/15 px-4 py-2 font-arial text-[10px] font-bold tracking-[0.2em] uppercase transition-colors hover:bg-white hover:text-black"
                >
                  <span aria-hidden>▶</span> Play
                </button>
              ) : (
                <span className="pixel-corner-sm shrink-0 bg-white/[0.06] px-4 py-2 font-arial text-[9px] font-bold tracking-[0.2em] whitespace-nowrap uppercase opacity-45">
                  Print not transferred
                </span>
              )}
            </div>
          </div>

          {/* The rail of cans. Horizontal below lg, where a column would push
              the picture off the screen; beside the set it is pinned to the
              cabinet's height and scrolls inside that. Absolute rather than
              `h-full`, so the list's own length never stretches the grid row —
              the picture alone decides how tall the pair is. */}
          <div className="lg:relative">
            <ul className="reel-list scrollbar-none -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 lg:absolute lg:inset-0 lg:mx-0 lg:flex-col lg:snap-none lg:overflow-x-hidden lg:overflow-y-auto lg:px-0">
              {reels.map((item, i) => {
                const on = i === current;
                return (
                  <li key={item.id} className="w-[16rem] shrink-0 snap-start lg:w-auto">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => select(i)}
                      className={`group relative flex h-full w-full cursor-pointer items-start gap-4 p-4 text-left transition-colors ${
                        on
                          ? "bg-[color:var(--ink)]/[0.09]"
                          : "bg-[color:var(--ink)]/[0.035] hover:bg-[color:var(--ink)]/[0.07]"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-[3px] origin-top transition-transform duration-300"
                        style={{
                          backgroundColor: item.inkHue,
                          transform: on ? "scaleY(1)" : "scaleY(0)",
                        }}
                      />
                      <span
                        className="mt-[2px] shrink-0 font-pixel text-[13px] tracking-[0.02em] transition-opacity"
                        style={{ color: item.inkHue, opacity: on ? 1 : 0.55 }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span className={`block font-garamond text-[19px] leading-[1.15] font-semibold transition-opacity ${on ? "opacity-100" : "opacity-70"}`}>
                          {item.speaker}
                        </span>
                        <span className="mt-1 block font-arial text-[9px] font-bold tracking-[0.18em] uppercase opacity-40">
                          {item.source} · {item.year}
                        </span>
                        <span className={`mt-2 block font-garamond text-[14px] leading-[1.45] transition-opacity ${on ? "opacity-70" : "opacity-0 lg:opacity-45"}`}>
                          {item.line}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* The list runs past the bottom edge — say so, in the ground's own
                colour so the cut reads as a fade rather than a hard crop. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-12 bg-gradient-to-t from-[color:var(--graphite)] to-transparent lg:block"
            />
          </div>
        </div>

        <div className={`reel-outro text-center ${inStage ? "mt-6" : "mt-12 sm:mt-16"}`}>
          <Link
            href="/video-library"
            className="inline-flex items-center gap-2 font-garamond text-[17px] tracking-wide opacity-75 transition-opacity hover:opacity-100"
          >
            The whole video library <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
