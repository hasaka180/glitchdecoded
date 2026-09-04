import Link from "next/link";

import MastheadArt from "./MastheadArt";

/**
 * The head of every page that is not the home scroll.
 *
 * Built as a card, because that is what the rest of the site is made of: the
 * animated category strip full-bleed, a fade that is darkest where the copy
 * sits, the accent on the rule, and light type over it. Not a flat black band —
 * the art is the ground, and it is moving.
 *
 * The masthead is therefore the dark sheet the section below is uncovered from,
 * which is what the `PaperTear` under it is tearing away.
 */
type Props = {
  eyebrow: string;
  title: string;
  dek?: string;
  /** Rendered under the dek — a standfirst, a byline, a form, whatever fits. */
  children?: React.ReactNode;
  /**
   * The broken signal bar that marks where the page proper starts. Off when a
   * `PaperTear` follows: the tear already marks that break, and two markers
   * stacked read as an unfinished layout rather than a deliberate one.
   */
  rule?: boolean;
  /** Category accent, where the page carries one. Colours the chip and title. */
  hue?: string;
  /**
   * Category slug whose strip runs behind the masthead. Omitted, all six run as
   * panels — the magazine rather than any one part of it.
   */
  art?: string;
};

export default function PageMasthead({
  eyebrow,
  title,
  dek,
  children,
  rule = true,
  hue,
  art,
}: Props) {
  return (
    <header className="relative isolate overflow-hidden bg-[#0b0a08] text-[color:var(--bone)]">
      <MastheadArt category={art} />

      {/* The card's fade: darkest under the copy, so the type never fights
          whatever the art happens to be doing there. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(8,7,6,0.72) 0%, rgba(8,7,6,0.32) 30%, rgba(8,7,6,0.78) 66%, rgba(8,7,6,0.95) 100%)",
        }}
      />

      {/* the card's rule, run along the top edge in the page's accent */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: hue ?? "var(--script-red)" }}
      />

      <div
        className={`relative mx-auto w-full max-w-[1400px] px-5 pt-28 sm:px-10 sm:pt-36 ${
          rule ? "pb-12 sm:pb-16" : "pb-16 sm:pb-20"
        }`}
      >
        <Link
          href="/"
          className="group inline-flex flex-wrap items-baseline gap-x-3 text-[color:var(--yellow)]"
        >
          <span className="font-signature text-[clamp(1.7rem,3.1vw,2.4rem)] leading-[0.8]">
            Glitch
          </span>
          <span className="font-pixel text-[clamp(1.05rem,1.9vw,1.5rem)] leading-[0.9] tracking-[-0.01em]">
            DECODED
          </span>
          <span
            aria-hidden
            className="ml-1 font-mono text-[10px] tracking-[0.24em] uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-60 group-focus-visible:opacity-60"
          >
            ← home
          </span>
        </Link>

        <p className="mt-10 flex items-center gap-3 font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-60 sm:text-[11px]">
          {hue && (
            <span
              aria-hidden
              className="size-2.5 shrink-0"
              style={{ backgroundColor: hue }}
            />
          )}
          {eyebrow}
        </p>

        <h1
          className="mt-4 max-w-[18ch] font-pixel text-[clamp(1.9rem,5.4vw,3.6rem)] leading-[1.1] tracking-[0.01em] uppercase"
          style={{ color: hue ?? "var(--bone)" }}
        >
          {title}
        </h1>

        {dek && (
          <p className="mt-6 max-w-[52ch] font-garamond text-[18px] leading-[1.55] opacity-80 sm:text-[20px]">
            {dek}
          </p>
        )}

        {children}

        {/* the nav's broken signal bar, marking where the page proper starts */}
        {rule && (
          <div aria-hidden className="mt-12 flex h-px w-full sm:mt-16">
            <span className="h-full flex-[3] bg-white/60" />
            <span className="h-full flex-[1]" />
            <span className="h-full flex-[6] bg-[color:var(--cyan)]/70" />
            <span className="h-full flex-[1]" />
            <span className="h-full flex-[2] bg-white/30" />
          </div>
        )}
      </div>
    </header>
  );
}
