import Link from "next/link";

import { CATEGORIES } from "@/lib/categories";

import PaperTear from "./PaperTear";

/**
 * The sign-off. The board is the last thing the reader touches, so the page
 * tears one final time — the note paper lifting off the ink it started on — and
 * closes the way a broadcast does: masthead, what is on the channel, then
 * colour bars and a dead cursor.
 *
 * Every section link points at its route. The remaining placeholders (article
 * slugs, the social handles) are kept as bare anchors, so wiring them up later
 * is one search.
 *
 * The tear at the top is the page above coming away, so the sheet colour is the
 * caller's to set: the home scroll and the note board end on paper, the rail,
 * the topics, the picks and the archive end on graphite, and a page that
 * already ends on ink passes `tear={false}` and meets the footer seamlessly.
 */
type Entry = {
  label: string;
  href: string;
  /** Category accent, where the link carries one. */
  hue?: string;
};

/** The six categories, in the rail's order and its colours. */
const SECTIONS: Entry[] = CATEGORIES.map(({ name, slug, hue }) => ({
  label: name,
  href: `/categories/${slug}`,
  hue,
}));

const MAGAZINE: Entry[] = [
  { label: "All categories", href: "/categories" },
  { label: "Video library", href: "/video-library" },
  { label: "Notes", href: "/notes" },
  { label: "The manifesto", href: "/about#manifesto" },
  { label: "About us", href: "/about" },
];

const TAKE_PART: Entry[] = [
  { label: "Submit a glitch", href: "/submit" },
  { label: "Contact us", href: "/contact" },
  { label: "Corrections", href: "/about#corrections" },
  { label: "Sign in", href: "/login" },
  { label: "Sign up", href: "/signup" },
];

/** Handles. Placeholder anchors, like the article slugs elsewhere. */
const ELSEWHERE: Entry[] = [
  { label: "Instagram", href: "#instagram" },
  { label: "YouTube", href: "#youtube" },
  { label: "Substack", href: "#substack" },
  { label: "RSS", href: "#rss" },
];

function Column({ title, links }: { title: string; links: Entry[] }) {
  return (
    <div>
      <h3 className="font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-45">
        {title}
      </h3>
      <ul className="mt-5 space-y-3">
        {links.map(({ label, href, hue }) => (
          <li key={label}>
            <Link
              href={href}
              className="group inline-flex items-center gap-3 font-garamond text-[16px] leading-none opacity-75 transition-opacity hover:opacity-100 sm:text-[17px]"
            >
              {hue ? (
                <span
                  aria-hidden
                  className="size-2 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: hue }}
                />
              ) : (
                <span
                  aria-hidden
                  className="size-2 shrink-0 bg-current opacity-0 transition-opacity group-hover:opacity-40"
                />
              )}
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

type FooterProps = {
  /** The ground the page above ends on — the sheet that tears away. */
  sheet?: string;
  /** Off for a page that already ends on ink; there is nothing to tear. */
  tear?: boolean;
};

export default function Footer({
  sheet = "var(--paper)",
  tear = true,
}: FooterProps = {}) {
  return (
    <>
      {/* the page above coming away from the ink underneath it */}
      {tear && <PaperTear sheet={sheet} ground="var(--ink)" />}

      <footer className="scanlines relative isolate overflow-hidden bg-[color:var(--ink)] text-[color:var(--bone)]">
        {/* Untuned static, behind everything. Two grains of generated noise
            that refresh on their own clocks, with an unlocked frame drifting
            through — the channel the magazine signs off into. */}
        <div
          aria-hidden
          className="static-mask pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <span className="static-field opacity-[0.3]" />
          <span className="static-field static-field-fine opacity-[0.22]" />
          <span
            className="static-roll absolute inset-x-0 top-0 h-[22%]"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.6) 62%, rgba(244,244,245,0.14) 74%, transparent 100%)",
            }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-[1400px] px-5 pt-14 pb-10 sm:px-10 sm:pt-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,0.62fr))] lg:gap-10">
            {/* The masthead, in the hero's two hands and the hero's yellow. */}
            <div className="max-w-[42ch]">
              <p className="flex flex-wrap items-baseline gap-x-3 text-[color:var(--yellow)]">
                <span className="font-signature text-[clamp(2.4rem,4.6vw,3.6rem)] leading-[0.8]">
                  Glitch
                </span>
                <span className="font-pixel text-[clamp(1.5rem,2.9vw,2.3rem)] leading-[0.9] tracking-[-0.01em]">
                  DECODED
                </span>
              </p>

              <p className="mt-6 font-garamond text-[17px] leading-[1.55] opacity-70 sm:text-[18px]">
                A magazine for the things the scroll hurries past. One piece at a
                time, and no algorithm deciding which.
              </p>

              <p className="mt-4 font-garamond text-[15px] leading-[1.55] opacity-45">
                Nothing here is tracked. The only thing this site remembers is
                the note you pinned, and that never leaves your browser.
              </p>

              <Link
                href="/submit"
                className="glitch mt-8 inline-block border border-white/70 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors hover:bg-white hover:text-[color:var(--red)]"
                data-text="Submit a glitch →"
              >
                Submit a glitch →
              </Link>

              <ul className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
                {ELSEWHERE.map(({ label, href }, i) => (
                  <li key={label} className="flex items-center gap-3">
                    <a
                      href={href}
                      className="glitch font-mono text-[11px] tracking-[0.18em] uppercase opacity-60 transition-opacity hover:opacity-100"
                      data-text={label}
                    >
                      {label}
                    </a>
                    {i < ELSEWHERE.length - 1 && (
                      <span aria-hidden className="text-[10px] opacity-30">
                        ·
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <Column title="Sections" links={SECTIONS} />
            <Column title="The magazine" links={MAGAZINE} />
            <Column title="Take part" links={TAKE_PART} />
          </div>

          {/* the nav's broken signal bar, closing what it opened */}
          <div aria-hidden className="mt-14 flex h-px w-full sm:mt-16">
            <span className="h-full flex-[3] bg-white/60" />
            <span className="h-full flex-[1]" />
            <span className="h-full flex-[6] bg-[color:var(--cyan)]/70" />
            <span className="h-full flex-[1]" />
            <span className="h-full flex-[2] bg-white/30" />
          </div>

          <div className="mt-7 flex flex-col gap-5 font-arial text-[9px] font-bold tracking-[0.18em] uppercase opacity-45 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <p>© {new Date().getFullYear()} Glitch Decoded</p>

            <p className="hidden max-w-[46ch] normal-case opacity-90 md:block">
              Set in Paquthy, Asthetic Pixel and Cormorant Garamond
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href="#privacy" className="transition-opacity hover:opacity-100">
                Privacy
              </a>
              <a href="#terms" className="transition-opacity hover:opacity-100">
                Terms
              </a>
              <Link
                href="/contact"
                className="transition-opacity hover:opacity-100"
              >
                Contact
              </Link>
            </div>
          </div>

          <p className="mt-9 flex items-center gap-2 font-mono text-[10px] tracking-[0.34em] uppercase opacity-35">
            End of transmission
            <span aria-hidden className="blink inline-block h-[9px] w-[7px] bg-current" />
          </p>
        </div>

        {/* Colour bars. The rail's six hues in its own order, the way a channel
            signs off — the last thing on screen before the set goes dark. */}
        <div aria-hidden className="flex h-3 w-full sm:h-4">
          {CATEGORIES.map(({ slug, hue }) => (
            <span key={slug} className="h-full flex-1" style={{ backgroundColor: hue }} />
          ))}
          <span className="h-full flex-1 bg-[color:var(--bone)]" />
        </div>
      </footer>
    </>
  );
}
