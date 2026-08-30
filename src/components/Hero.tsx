import type { CSSProperties } from "react";
import PixelUnglitch from "./PixelUnglitch";

export default function Hero() {
  return (
    <section className="scanlines relative isolate min-h-[100svh] overflow-hidden bg-[color:var(--ink)]">
      {/* Base layer: the photo, fractured into glass panes under the pointer. */}
      <PixelUnglitch
        className="absolute inset-0 -z-10"
        src="/assets/wallpaper.jpg"
        unit={18}
        radius={255}
        focus={[0.51, 0.5]}
        anchor={[0.56, 0.46]}
        zoom={1.15}
        mobileSrc="/assets/wallpapermob.jpg"
        mobileFocus={[0.52, 0.52]}
        mobileAnchor={[0.5, 0.44]}
        mobileZoom={1.02}
      />

      {/* light sweep */}
      <div className="sweep pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-transparent via-white/25 to-transparent" />

      {/* legibility: no flat veil — only soft scrims where type sits */}
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden w-2/5 bg-gradient-to-r from-[color:var(--ink)]/60 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-2/5 bg-gradient-to-l from-[color:var(--ink)]/50 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-[color:var(--ink)]/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-[color:var(--ink)]/80 to-transparent sm:h-1/3 sm:from-[color:var(--ink)]/70" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1500px] flex-col px-5 pt-24 pb-28 sm:px-10 sm:pb-20">
        {/* One word, set big in a bitmap face and fractured by the panes
            passing behind it. */}
        <h1 className="flex flex-1 items-end justify-center">
          <span
            className="glitch font-pixel text-[clamp(3rem,20vw,15rem)] leading-[0.85] tracking-[-0.01em] text-[color:var(--yellow)] [text-shadow:6px_6px_0_rgba(7,7,12,0.45)]"
            data-text="DECODED"
            style={{ "--glitch-delay": "1.4s" } as CSSProperties}
          >
            DECODED
          </span>
        </h1>
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
