import Link from "next/link";

import { PICKS, type Pick } from "@/lib/recommended";

/**
 * Picks surfaced from the topics above, on the same graphite ground as the
 * topic field. Cards are black with a still image and a fade — no coloured
 * ground; the hue only reaches the label and the top rule.
 */


/**
 * A still, cropped to fill whatever box it is given. `pixelated` keeps the
 * current art — a 132x176 still of the category sprite — crisp as it upscales;
 * drop it if these are replaced with photographs.
 */
function CardImage({
  image,
  pixel,
  className,
}: {
  image: string;
  pixel: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`absolute inset-0 bg-cover bg-center ${className ?? ""}`}
      style={{
        backgroundImage: `url(${image})`,
        // Only the site's own pixel art wants this. A photograph the desk
        // uploaded would come out as blocks.
        imageRendering: pixel ? "pixelated" : undefined,
      }}
    />
  );
}

/** Black, not the card's colour: darkest where the copy sits. */
function Fade({ stops }: { stops: string }) {
  return (
    <span
      aria-hidden
      className="absolute inset-0"
      style={{ backgroundImage: `linear-gradient(to bottom, ${stops})` }}
    />
  );
}

/** A rule that runs the card's top edge as it is picked up. */
function TopRule({ hue }: { hue: string }) {
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-[0.28] transition-transform duration-300 group-hover:scale-x-100"
      style={{ backgroundColor: hue }}
    />
  );
}

/**
 * The reason the pick surfaced. Its own line, because at a quarter of the grid
 * a card is ~270px wide and the reason plus a read time wraps.
 */
function Reason({ from }: { from: string }) {
  return (
    <p className="font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-45">
      Because you read {from}
    </p>
  );
}

function Minutes({ minutes }: { minutes: number }) {
  return (
    <span className="shrink-0 font-arial text-[9px] font-bold tracking-[0.16em] whitespace-nowrap uppercase opacity-55">
      {minutes} min
    </span>
  );
}

export default function RecommendedGrid({ picks = PICKS }: { picks?: Pick[] }) {
  const [featured, ...rest] = picks;

  return (
    <section
      id="recommended"
      className="relative overflow-hidden bg-[color:var(--graphite)] pt-14 pb-20 text-[color:var(--ink)] sm:pt-20 sm:pb-28"
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-10">
        {/* The ground no longer changes at the section break, so the nav's
            broken signal bar marks it instead. */}
        <div aria-hidden className="mb-10 flex h-px w-full sm:mb-14">
          <span className="h-full flex-[3] bg-[color:var(--ink)]/25" />
          <span className="h-full flex-[1]" />
          <span className="h-full flex-[6] bg-[color:var(--ink)]/12" />
          <span className="h-full flex-[1]" />
          <span className="h-full flex-[2] bg-[color:var(--ink)]/30" />
        </div>

        <header className="mb-10 flex flex-col gap-5 sm:mb-14 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div>
            <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
              Your reading
            </p>
            <h2 className="mt-4 font-pixel text-[26px] leading-[1.15] tracking-[0.02em] uppercase sm:text-[42px]">
              Recommended for you
            </h2>
          </div>
          <p className="max-w-[32ch] font-garamond text-[16px] leading-[1.5] opacity-70 sm:text-right">
            Five pieces, picked from the topics you stopped on rather than the
            ones everybody clicks.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Featured — two columns and both rows, so the four cards beside it
              fill the remaining 2x2 exactly. The image runs the whole card and
              the copy sits on the black end of the fade. */}
          <li className="sm:col-span-2 lg:row-span-2">
            <a
              href={featured.href}
              className="pixel-corner group relative flex h-full min-h-[28rem] flex-col justify-between overflow-hidden bg-black p-6 text-[color:var(--bone)] transition-transform duration-300 hover:-translate-y-1 sm:p-8"
            >
              <CardImage image={featured.image} pixel={featured.pixel} />
              <Fade stops="rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.22) 48%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.78) 100%" />
              <TopRule hue={featured.hue} />

              <div className="relative flex items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="size-2 shrink-0"
                    style={{ backgroundColor: featured.hue }}
                  />
                  <span className="font-arial text-[9px] font-bold tracking-[0.22em] uppercase opacity-80">
                    Editor&rsquo;s pick
                  </span>
                </span>
                <Minutes minutes={featured.minutes} />
              </div>

              <div className="relative">
                <span
                  className="font-pixel text-[15px] tracking-[0.02em] uppercase sm:text-[17px]"
                  style={{ color: featured.hue }}
                >
                  {featured.category}
                </span>
                <h3 className="mt-3 max-w-[26ch] font-garamond text-[27px] leading-[1.15] font-semibold sm:text-[34px]">
                  {featured.title}
                </h3>
                <p className="mt-4 max-w-[46ch] font-garamond text-[16px] leading-[1.55] opacity-75 sm:text-[17px]">
                  {featured.dek}
                </p>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <Reason from={featured.from} />
                  <span className="pixel-corner-sm flex size-9 shrink-0 items-center justify-center bg-white/15 text-sm transition-colors group-hover:bg-white group-hover:text-black">
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </div>
            </a>
          </li>

          {rest.map((pick) => (
            <li key={pick.slug}>
              <a
                href={pick.href}
                className="pixel-corner group relative flex h-full flex-col overflow-hidden bg-black text-[color:var(--bone)] transition-transform duration-300 hover:-translate-y-1"
              >
                {/* the image keeps its own band; the copy sits on black under it */}
                <span className="relative block aspect-[3/2] w-full overflow-hidden">
                  <CardImage image={pick.image} pixel={pick.pixel} />
                  <Fade stops="rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.3) 80%, #000 100%" />
                </span>
                <TopRule hue={pick.hue} />

                <div className="relative flex flex-1 flex-col justify-between gap-5 p-5 pt-0">
                  <span className="flex items-center justify-between gap-3">
                    <span
                      className="font-pixel text-[12px] tracking-[0.02em] uppercase"
                      style={{ color: pick.hue }}
                    >
                      {pick.category}
                    </span>
                    <Minutes minutes={pick.minutes} />
                  </span>

                  <div>
                    <h3 className="font-garamond text-[20px] leading-[1.2] font-semibold">
                      {pick.title}
                    </h3>
                    <p className="mt-2 font-garamond text-[14px] leading-[1.5] opacity-65">
                      {pick.dek}
                    </p>
                    <span className="mt-4 block">
                      <Reason from={pick.from} />
                    </span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-14 text-center sm:mt-16">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 font-garamond text-[17px] tracking-wide opacity-75 transition-opacity hover:opacity-100"
          >
            Browse the full archive <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
