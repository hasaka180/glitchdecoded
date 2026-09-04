"use client";

import { useRef, useState } from "react";

import {
  type Reel,
  REELS,
  embedSrc,
  thumbnailSrc,
  watchUrl,
  youtubeId,
} from "@/lib/videos";

/**
 * The library, played through the same set the home page uses: a CRT with
 * scanlines, a roll bar and untuned static, and a printed programme beside it.
 *
 * A linked reel shows its own YouTube still on its card; an unlinked one falls
 * back to the pixel title card, which is the honest picture of an archive entry
 * nobody has digitised. The player is only built when someone presses play, and
 * it is the cookie-free host, so nothing starts a session until it is watched.
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
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <span aria-hidden className="crt-roll pointer-events-none absolute inset-x-0 h-[14%]" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </>
  );
}

/** The card the tube holds before anything is fetched. */
function TitleCard({ reel, index }: { reel: Reel; index: number }) {
  return (
    <div
      className="crt-flicker absolute inset-0 flex flex-col justify-between p-4 sm:p-9"
      style={{
        backgroundImage: `radial-gradient(90% 70% at 50% 40%, ${reel.hue}22, transparent 70%), linear-gradient(160deg, #16130e, #05040a)`,
      }}
    >
      <div className="flex items-start justify-between gap-6">
        <p
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: reel.hue }}
        >
          Reel {String(index + 1).padStart(2, "0")}
        </p>
        <p className="font-mono text-[10px] tracking-[0.24em] uppercase opacity-50">
          {reel.stock}
        </p>
      </div>

      <div>
        <p
          className="font-pixel text-[clamp(1.05rem,3.4vw,2.3rem)] leading-[1.1] uppercase"
          style={{ color: reel.hue }}
        >
          {reel.speaker}
        </p>
        {/* Clamped rather than left to wrap: the card is pinned to the tube's
            box, so a long line has nowhere to go and would run under the row
            below it. Three lines is what the frame holds on a phone. */}
        <p className="reel-line mt-2 max-w-[42ch] font-garamond text-[13px] leading-[1.4] opacity-75 sm:mt-4 sm:text-[18px] sm:leading-[1.5]">
          {reel.line}
        </p>
      </div>

      <p className="font-mono text-[10px] tracking-[0.24em] uppercase opacity-45">
        {reel.source} · {reel.year}
      </p>
    </div>
  );
}

export default function VideoLibrary() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tuning, setTuning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reel = REELS[current];
  const id = youtubeId(reel.url);

  /** Changing reel snaps the tube to static for a beat, the way a set does. */
  const select = (index: number) => {
    if (index === current) return;
    setCurrent(index);
    setPlaying(false);
    setTuning(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTuning(false), 260);
  };

  return (
    <div>
      {/* Same guard as the screening room: a bare track measures its content,
          and a fixed-width child would haul the whole set off the screen. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-8">
      {/* The set: cabinet, perforated edges, picture. */}
      {/* The cabinet's chrome is fixed furniture, so on a phone it is the
          picture that pays for it — 44px of a 390px screen went on padding,
          sprockets and inset. Halved below sm, which buys the tube most of the
          screen width back. */}
      <div className="pixel-corner relative bg-black p-1.5 text-[color:var(--bone)] sm:p-4">
        <span aria-hidden className="sprockets absolute inset-y-3 left-[3px] w-[4px] opacity-40 sm:inset-y-4 sm:left-[6px] sm:w-[6px]" />
        <span aria-hidden className="sprockets absolute inset-y-3 right-[3px] w-[4px] opacity-40 sm:inset-y-4 sm:right-[6px] sm:w-[6px]" />

        <div className="relative mx-[7px] overflow-hidden rounded-[10px] bg-black sm:mx-[10px]">
          {/* 16/9 is what the reels actually are, so a player fills the frame
              instead of sitting letterboxed inside a 16/10 one. */}
          <div className="relative aspect-video w-full">
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
            ) : (
              <>
                <TitleCard reel={reel} index={current} />
                <Static opacity={tuning ? 0.9 : 0.07} />
                <Tube />

                {/* Play sits over the card rather than under it: pressing it is
                    the moment the third party is allowed in. */}
                {id ? (
                  <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    className="group absolute inset-0 flex items-center justify-center outline-none"
                    aria-label={`Play ${reel.speaker}, ${reel.source} ${reel.year}`}
                  >
                    <span
                      className="pixel-corner flex size-[74px] items-center justify-center bg-black/55 text-[22px] backdrop-blur-sm transition-colors group-hover:bg-white group-focus-visible:bg-white group-hover:text-black group-focus-visible:text-black"
                      style={{ color: reel.hue }}
                    >
                      <span aria-hidden>▶</span>
                    </span>
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* the strip under the picture */}
        <div className="mt-2 flex items-center justify-between gap-3 px-[7px] pb-1 sm:mt-3 sm:gap-4 sm:px-[10px]">
          {/* Truncates rather than wraps: the strip is one line of furniture
              under the picture, and the card above already prints the full
              credit. */}
          <p className="min-w-0 truncate font-mono text-[9px] tracking-[0.18em] uppercase opacity-55 sm:text-[10px] sm:tracking-[0.22em]">
            {reel.source} · {reel.year}
            {reel.runtime && ` · ${reel.runtime}`}
          </p>

          {/* The transfer's state sits in the strip rather than over the
              picture: the card fills the tube at every width, so a notice
              inside it lands on the copy. The screening room says it here
              too. */}
          {id ? (
            <a
              href={watchUrl(id)}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 font-mono text-[9px] tracking-[0.18em] whitespace-nowrap uppercase opacity-45 transition-opacity hover:opacity-90 sm:text-[10px] sm:tracking-[0.22em]"
            >
              Watch on YouTube ↗
            </a>
          ) : (
            <span className="shrink-0 font-mono text-[9px] tracking-[0.18em] whitespace-nowrap uppercase opacity-40 sm:text-[10px] sm:tracking-[0.22em]">
              Not transferred
            </span>
          )}
        </div>
      </div>

      {/* Now playing, beside the set. */}
      <div className="flex flex-col justify-center">
        <p className="font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-45">
          Now playing
        </p>

        <h2
          className="mt-4 font-pixel text-[clamp(1.4rem,3vw,2rem)] leading-[1.1] uppercase"
          style={{ color: reel.inkHue }}
        >
          {reel.speaker}
        </h2>

        <p className="mt-4 max-w-[42ch] font-garamond text-[17px] leading-[1.55] opacity-70">
          {reel.line}
        </p>

        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[color:var(--ink)]/15 pt-5">
          {[
            ["Source", reel.source],
            ["Year", reel.year],
            ["Stock", reel.stock],
            ["Runtime", reel.runtime ?? "—"],
          ].map(([term, def]) => (
            <div key={term}>
              <dt className="font-mono text-[9px] tracking-[0.22em] uppercase opacity-40">
                {term}
              </dt>
              <dd className="mt-1 font-garamond text-[16px] leading-[1.35] opacity-80">
                {def}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      </div>

      {/* The programme, as thumbnails. A linked reel shows its own still; an
          unlinked one keeps the pixel card, so the shelf never has a hole in
          it where a transfer is missing. */}
      <div className="mt-14 sm:mt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
            The programme
          </h2>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-40">
            {REELS.length} reels
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REELS.map((entry, i) => {
            const entryId = youtubeId(entry.url);
            const live = i === current;

            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => select(i)}
                  aria-current={live ? "true" : undefined}
                  className="group block w-full text-left outline-none"
                >
                  <span
                    className="pixel-corner relative block aspect-video w-full overflow-hidden bg-black transition-transform duration-300 group-hover:-translate-y-1"
                    style={live ? { boxShadow: `0 0 0 3px ${entry.inkHue}` } : undefined}
                  >
                    {entryId ? (
                      // A YouTube still on whatever host the CDN serves;
                      // next/image would need it configured as a remote host.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnailSrc(entryId)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `radial-gradient(85% 70% at 50% 40%, ${entry.hue}2e, transparent 70%), linear-gradient(160deg, #16130e, #05040a)`,
                        }}
                      />
                    )}

                    {/* scanlines, so a YouTube still still belongs to this set */}
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px)",
                      }}
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(to bottom, rgba(6,5,4,0.15) 0%, transparent 40%, rgba(6,5,4,0.85) 100%)",
                      }}
                    />

                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-[0.3] transition-transform duration-300 group-hover:scale-x-100"
                      style={{ backgroundColor: entry.hue }}
                    />

                    {/* the play badge, or the state of the transfer */}
                    <span className="absolute inset-0 flex items-center justify-center">
                      {entryId ? (
                        <span
                          className="pixel-corner flex size-12 items-center justify-center bg-black/50 text-[15px] backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-black"
                          style={{ color: entry.hue }}
                        >
                          <span aria-hidden>▶</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] tracking-[0.22em] text-white/45 uppercase">
                          not transferred
                        </span>
                      )}
                    </span>

                    <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
                      <span className="min-w-0">
                        <span
                          className="block truncate font-pixel text-[15px] leading-[1.15] uppercase"
                          style={{ color: entry.hue }}
                        >
                          {entry.speaker}
                        </span>
                        <span className="mt-1 block truncate font-mono text-[9px] tracking-[0.18em] text-white/55 uppercase">
                          {entry.source} · {entry.year}
                        </span>
                      </span>
                      {entry.runtime && (
                        <span className="shrink-0 font-arial text-[9px] font-bold tracking-[0.14em] text-white/70 uppercase">
                          {entry.runtime}
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="mt-3 block max-w-[46ch] font-garamond text-[15px] leading-[1.45] opacity-60 transition-opacity group-hover:opacity-90">
                    {entry.line}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
