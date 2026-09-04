import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import PageMasthead from "@/components/PageMasthead";
import PaperTear from "@/components/PaperTear";

export const metadata: Metadata = {
  title: "About us — Glitch Decoded",
  description:
    "Who makes this magazine, what it refuses to do, and how to tell us when we get something wrong.",
};

/** The manifesto, numbered the way a masthead numbers its rules. */
const RULES: { head: string; body: string }[] = [
  {
    head: "One thing at a time",
    body: "A page here holds a single piece. Nothing autoplays underneath it, nothing queues up next, and there is no infinite bottom to fall through. When you are finished, the page is finished.",
  },
  {
    head: "No algorithm decides",
    body: "Every piece on this site was chosen by a person who read it. The order is an editor's order. If something is at the top, it is because someone thought it should be, and that someone can be argued with.",
  },
  {
    head: "The unpopular opinion gets the space",
    body: "Not for the heat. Because a position nobody is defending in public is usually the one that has not been examined in public either, and the examination is the interesting part.",
  },
  {
    head: "Untold is not the same as secret",
    body: "Most of what goes untold is not hidden — it is simply boring to a feed. Slow, local, unresolved, or happening to people with no reach. Those are the stories that need somebody to sit with them.",
  },
  {
    head: "We show the working",
    body: "Sources are named. Uncertainty is written as uncertainty. When a piece rests on one person's account, it says so in the piece rather than in a note at the bottom nobody reaches.",
  },
  {
    head: "Nothing here watches you",
    body: "No analytics and no tracking pixels. The video library is the one place a third party appears: YouTube serves the thumbnails, and the player is only built — on its cookie-free host — once you press play. The only thing this site remembers is the note you pin on the board, and that never leaves your browser.",
  },
];

const MASTHEAD: { role: string; name: string; line: string }[] = [
  {
    role: "Editor",
    name: "The desk",
    line: "Commissions, reads everything twice, writes the note that opens each issue.",
  },
  {
    role: "Reporting",
    name: "Contributors",
    line: "Freelance, paid on acceptance, credited in full. The archive is theirs as much as ours.",
  },
  {
    role: "Pictures & film",
    name: "The screening room",
    line: "Programmes the archive, clears the rights, keeps the projector threaded.",
  },
  {
    role: "Corrections",
    name: "Everyone",
    line: "There is no separate department. Whoever wrote it fixes it, in public.",
  },
];

function Rule({ n, head, body }: { n: number; head: string; body: string }) {
  return (
    <li className="relative border-t border-[color:var(--ink-brown)]/20 pt-6">
      <span
        aria-hidden
        className="font-mono text-[11px] tracking-[0.24em] text-[color:var(--script-red)]"
      >
        {String(n).padStart(2, "0")}
      </span>
      <h3 className="mt-3 font-pixel text-[19px] leading-[1.2] tracking-[0.01em] uppercase sm:text-[22px]">
        {head}
      </h3>
      <p className="mt-3 font-garamond text-[17px] leading-[1.6] opacity-70 sm:text-[18px]">
        {body}
      </p>
    </li>
  );
}

export default function AboutPage() {
  return (
    <>
      <main className="flex-1">
        <PageMasthead
          eyebrow="About us"
          title="A glitch in the matrix, decoded"
          dek="A small magazine for the things the scroll hurries past — the opinion nobody wants to hold in public, and the story nobody had a reason to tell."
          rule={false}
        />


        {/* The masthead's dark band coming away to uncover the stock the
            section is printed on. */}
        <PaperTear sheet="var(--ink)" ground="var(--paper)" />

        <div className="paper relative isolate overflow-hidden text-[color:var(--ink-brown)]">
          <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-20 sm:px-10 sm:pb-28">
            {/* the standfirst, in the note's hand */}
            <section className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
              <p className="font-signature text-[clamp(1.9rem,4vw,3rem)] leading-[1.15] text-[color:var(--script-red)]">
                Somewhere between the noise and the feed, a few things slip
                through.
              </p>

              <div className="max-w-[58ch] space-y-5 font-garamond text-[18px] leading-[1.6] opacity-75 sm:text-[19px]">
                <p>
                  Glitch Decoded started as a folder of tabs nobody had time to
                  read. Arguments that were too long for a thread, reporting
                  that never found a home because it had no news hook, films
                  that eleven people had seen. The common thread was not
                  subject — it was pace. All of it needed longer than a feed
                  gives anything.
                </p>
                <p>
                  So this became the place with the longer clock. It publishes
                  slowly, and on purpose. There is no homepage that changes
                  every twenty minutes and no reason for you to come back daily.
                  Read one thing properly, then close the tab. That is the whole
                  design.
                </p>
                <p>
                  The name is a joke that stuck. A glitch is the moment the
                  picture fractures and you can see the machinery behind it — a
                  gap in the smooth surface where something real leaks through.
                  Decoding it is the job.
                </p>
              </div>
            </section>

            <div aria-hidden className="flex h-px w-full">
              <span className="h-full flex-[3] bg-[color:var(--ink-brown)]/45" />
              <span className="h-full flex-[1]" />
              <span className="h-full flex-[6] bg-[color:var(--script-red)]/55" />
              <span className="h-full flex-[1]" />
              <span className="h-full flex-[2] bg-[color:var(--ink-brown)]/25" />
            </div>

            {/* ------------------------------------------------ manifesto -- */}
            <section id="manifesto" className="scroll-mt-24 pt-16 sm:pt-20">
              <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-45 sm:text-[11px]">
                The manifesto
              </p>
              <h2 className="mt-4 max-w-[20ch] font-pixel text-[clamp(1.6rem,4vw,2.6rem)] leading-[1.15] uppercase">
                Six rules we hold ourselves to
              </h2>

              <ol className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {RULES.map((rule, i) => (
                  <Rule key={rule.head} n={i + 1} {...rule} />
                ))}
              </ol>
            </section>

            {/* ------------------------------------------------- masthead -- */}
            <section className="pt-20 sm:pt-28">
              <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-45 sm:text-[11px]">
                Who makes it
              </p>
              <h2 className="mt-4 font-pixel text-[clamp(1.6rem,4vw,2.6rem)] leading-[1.15] uppercase">
                The masthead
              </h2>

              <dl className="mt-10 divide-y divide-[color:var(--ink-brown)]/20 border-y border-[color:var(--ink-brown)]/20">
                {MASTHEAD.map(({ role, name, line }) => (
                  <div
                    key={role}
                    className="grid gap-2 py-6 sm:grid-cols-[minmax(0,0.5fr)_minmax(0,0.6fr)_minmax(0,1.4fr)] sm:items-baseline sm:gap-8"
                  >
                    <dt className="font-mono text-[10px] tracking-[0.24em] uppercase opacity-45">
                      {role}
                    </dt>
                    <dd className="font-pixel text-[16px] tracking-[0.01em] uppercase text-[color:var(--yellow)]">
                      {name}
                    </dd>
                    <dd className="font-garamond text-[17px] leading-[1.55] opacity-70">
                      {line}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ---------------------------------------------- corrections -- */}
            <section id="corrections" className="scroll-mt-24 pt-20 sm:pt-28">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
                <div>
                  <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-45 sm:text-[11px]">
                    When we get it wrong
                  </p>
                  <h2 className="mt-4 max-w-[16ch] font-pixel text-[clamp(1.6rem,4vw,2.6rem)] leading-[1.15] uppercase">
                    Corrections
                  </h2>

                  <div className="mt-6 max-w-[54ch] space-y-5 font-garamond text-[17px] leading-[1.6] opacity-75 sm:text-[18px]">
                    <p>
                      Anything factual that is wrong gets fixed in the piece and
                      logged at the foot of it, with the date and what changed.
                      We do not quietly edit and move on, and we do not delete a
                      piece to make an error disappear.
                    </p>
                    <p>
                      If the error goes to the substance of the argument rather
                      than a detail, the note goes at the top, where you cannot
                      miss it.
                    </p>
                    <p>
                      Found one? Say so. Point at the sentence, tell us what it
                      should say, and if you have a source, send it.
                    </p>
                  </div>

                  <Link
                    href="/contact"
                    className="glitch mt-8 inline-block border border-[color:var(--ink-brown)]/70 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors hover:bg-[color:var(--ink-brown)] hover:text-[color:var(--paper)]"
                    data-text="Report a correction →"
                  >
                    Report a correction →
                  </Link>
                </div>

                {/* colophon */}
                <div className="border border-[color:var(--ink-brown)]/20 bg-white/50 p-6 sm:p-8">
                  <p className="font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-45">
                    Colophon
                  </p>

                  <dl className="mt-6 space-y-5 font-garamond text-[16px] leading-[1.5]">
                    {[
                      ["Display", "Asthetic Pixel — the bitmap word mark"],
                      ["Hand", "Paquthy — the signature that runs ahead of it"],
                      ["Text", "Cormorant Garamond"],
                      ["Labels", "Geist Mono, Arial"],
                      ["Built with", "Next.js, hand-written CSS, no tracking"],
                      ["Video", "YouTube stills; the cookie-free player on play"],
                      ["Kept", "Your pinned note, in your browser only"],
                    ].map(([term, def]) => (
                      <div key={term}>
                        <dt className="font-mono text-[9px] tracking-[0.24em] uppercase opacity-40">
                          {term}
                        </dt>
                        <dd className="mt-1 opacity-75">{def}</dd>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-8 font-garamond text-[15px] leading-[1.55] opacity-45">
                    Everything on this site is served as it is written. There is
                    no consent banner because nothing here sets a cookie —
                    including the film player, which runs on the host that
                    does not.
                  </p>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------- CTA --- */}
            <section className="mt-20 border-t border-[color:var(--ink-brown)]/20 pt-12 sm:mt-28">
              <div className="flex flex-wrap items-end justify-between gap-8">
                <div className="max-w-[46ch]">
                  <h2 className="font-pixel text-[clamp(1.4rem,3.2vw,2rem)] leading-[1.2] uppercase text-[color:var(--script-red)]">
                    Seen a glitch?
                  </h2>
                  <p className="mt-4 font-garamond text-[18px] leading-[1.55] opacity-70">
                    The best pieces here started as somebody&rsquo;s stray
                    observation that nothing about a thing added up. Send yours.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/submit"
                    className="glitch border border-[color:var(--ink-brown)]/70 px-5 py-3 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors hover:bg-[color:var(--ink-brown)] hover:text-[color:var(--paper)]"
                    data-text="Submit a glitch →"
                  >
                    Submit a glitch →
                  </Link>
                  <Link
                    href="/contact"
                    className="font-mono text-[11px] tracking-[0.2em] uppercase opacity-55 transition-opacity hover:opacity-100"
                  >
                    Or just write to us →
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Ends on the masthead's own stock, so the footer tears that away. */}
      <Footer sheet="var(--paper)" />
    </>
  );
}
