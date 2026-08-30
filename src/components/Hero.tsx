import type { CSSProperties } from "react";
import PixelUnglitch from "./PixelUnglitch";

export default function Hero() {
  return (
    <section className="scanlines relative isolate min-h-[100svh] overflow-hidden bg-[color:var(--red)]">
      {/* Reveal layer: red plate that unglitches into the photo beneath. */}
      <PixelUnglitch
        className="absolute inset-0 -z-10"
        src="/assets/background.png"
        unit={18}
        radius={255}
      />

      {/* light sweep */}
      <div className="sweep pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-transparent via-white/25 to-transparent" />

      {/* legibility scrims — both flanks carry type */}
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/3 bg-gradient-to-r from-[color:var(--red)]/85 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/3 bg-gradient-to-l from-[color:var(--red)]/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-[color:var(--red)]/90 via-[color:var(--red)]/40 to-transparent sm:h-1/4 sm:from-[color:var(--red)]/70 sm:via-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1500px] flex-col px-5 pt-32 pb-24 sm:px-10">
        <p className="font-mono text-[10px] tracking-[0.32em] text-white/85 uppercase sm:text-[11px]">
          <span className="mr-3 inline-block size-2 translate-y-px bg-white" />
          Unpopular opinions · untold stories
        </p>

        {/* The two halves straddle the subject: one upper-left of her, one
            lower-right, so the reveal reads as the thing between them. */}
        <div className="grid flex-1 grid-cols-1 content-between gap-10 py-[4vh] sm:grid-cols-2 sm:grid-rows-2 sm:gap-0">
          <h1 className="justify-self-start self-start sm:col-start-1 sm:row-start-1">
            <span
              className="glitch block text-[clamp(2rem,5.4vw,4.6rem)] leading-[0.95] font-black tracking-[-0.02em] uppercase"
              data-text="Explore the"
              style={{ "--glitch-delay": "0.6s" } as CSSProperties}
            >
              Explore the
            </span>
            <span
              className="glitch block font-display text-[clamp(2.6rem,7.4vw,6.4rem)] leading-[0.95] font-medium italic"
              data-text="Glitch →"
              style={{ "--glitch-delay": "2.1s" } as CSSProperties}
            >
              Glitch →
            </span>
          </h1>

          <h2 className="justify-self-end self-end text-right sm:col-start-2 sm:row-start-2">
            <span
              className="glitch block text-[clamp(2rem,5.4vw,4.6rem)] leading-[0.95] font-black tracking-[-0.02em] uppercase"
              data-text="Question"
              style={{ "--glitch-delay": "3.4s" } as CSSProperties}
            >
              Question
            </span>
            <span
              className="glitch block font-display text-[clamp(2.6rem,7.4vw,6.4rem)] leading-[0.95] font-medium italic"
              data-text="Everything"
              style={{ "--glitch-delay": "4.9s" } as CSSProperties}
            >
              Everything
            </span>
          </h2>
        </div>
      </div>

      <a
        href="#work"
        className="absolute inset-x-0 bottom-7 z-10 mx-auto flex w-fit flex-col items-center gap-2 text-white/85 transition-opacity hover:opacity-100"
      >
        <span
          className="glitch font-mono text-[10px] tracking-[0.34em] uppercase"
          data-text="Scroll down"
          style={{ "--glitch-delay": "5.6s" } as CSSProperties}
        >
          Scroll down
        </span>
        <span aria-hidden className="text-xs leading-none">
          ↓
        </span>
      </a>
    </section>
  );
}
