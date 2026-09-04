import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/Footer";
import PageMasthead from "@/components/PageMasthead";
import PaperTear from "@/components/PaperTear";
import SubmitForm from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit a Glitch — Glitch Decoded",
  description:
    "Pitch the argument nobody is making, or the story nobody had a reason to tell. Here is what we look for and how to send it.",
};

const WANTED: { head: string; body: string }[] = [
  {
    head: "The argument you keep losing",
    body: "A position you hold that reliably empties a room, and that you can actually defend. We are after the reasoning, not the provocation — if the whole piece is the headline, it is not a piece.",
  },
  {
    head: "The story with no news hook",
    body: "Something true, slow and unresolved, happening to people with no reach. If the reason it has gone unreported is that nothing about it is urgent, that is a point in its favour here.",
  },
  {
    head: "The thing that does not add up",
    body: "A number quoted everywhere that nobody has traced, a consensus with no origin, a detail that stops making sense the moment you look twice. Bring the loose thread; we will help you pull it.",
  },
];

const STEPS: { when: string; what: string }[] = [
  { when: "Within a week", what: "A reply either way. Silence is not our answer." },
  { when: "If it is a yes", what: "A commission with a fee, a length and a date, agreed before you write." },
  { when: "While you write", what: "One editor, reading drafts. You keep the byline and the rights." },
  { when: "If it is a no", what: "The reason, in a paragraph. Pitch again — plenty of contributors did." },
];

export default function SubmitPage() {
  return (
    <>
      <main className="flex-1">
        <PageMasthead
          eyebrow="Take part"
          title="Submit a glitch"
          dek="Every piece here started as somebody noticing that a thing did not add up, and refusing to scroll past it. If that is you, this is the form."
          rule={false}
        />



        {/* The masthead's dark band coming away to uncover the stock the
            section is printed on. */}
        <PaperTear sheet="var(--ink)" ground="var(--paper)" />

        <section className="paper relative isolate text-[color:var(--ink-brown)]">
          <div className="mx-auto w-full max-w-[1400px] px-5 py-16 sm:px-10 sm:py-24">
            {/* -------------------------------------------- what we want -- */}
            <p className="font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50 sm:text-[11px]">
              What we are looking for
            </p>
            <h2 className="mt-4 max-w-[22ch] font-pixel text-[clamp(1.5rem,3.6vw,2.4rem)] leading-[1.15] uppercase text-[color:var(--script-red)]">
              Three kinds of thing
            </h2>

            <ol className="mt-10 grid gap-x-12 gap-y-9 md:grid-cols-3">
              {WANTED.map(({ head, body }, i) => (
                <li
                  key={head}
                  className="border-t border-[color:var(--ink-brown)]/20 pt-5"
                >
                  <span
                    aria-hidden
                    className="font-mono text-[11px] tracking-[0.24em] text-[color:var(--script-red)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-pixel text-[17px] leading-[1.25] uppercase sm:text-[19px]">
                    {head}
                  </h3>
                  <p className="mt-3 font-garamond text-[17px] leading-[1.6] opacity-75">
                    {body}
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-10 max-w-[64ch] font-garamond text-[17px] leading-[1.6] opacity-55">
              What we do not run: press releases dressed as essays, anything
              written to rank, hot takes on a story that broke this morning, and
              pieces whose entire case rests on a screenshot. Nothing personal —
              they simply do not survive a second read, which is the only read
              that counts here.
            </p>

            {/* ------------------------------------------------- the form -- */}
            <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-16 sm:mt-20">
              <div>
                <h2 className="font-pixel text-[clamp(1.4rem,3.2vw,2rem)] leading-[1.15] uppercase">
                  The pitch
                </h2>
                <p className="mt-4 max-w-[52ch] font-garamond text-[17px] leading-[1.6] opacity-65">
                  Write it as you would say it. We would rather read four honest
                  paragraphs than a polished proposal that hides what the piece
                  is actually about.
                </p>

                <div className="mt-9">
                  <SubmitForm />
                </div>
              </div>

              {/* what happens next */}
              <aside className="lg:pt-2">
                <div className="border border-[color:var(--ink-brown)]/20 bg-white/50 p-6 sm:p-7">
                  <p className="font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-55">
                    What happens next
                  </p>

                  <dl className="mt-6 space-y-5">
                    {STEPS.map(({ when, what }) => (
                      <div key={when}>
                        <dt className="font-mono text-[9px] tracking-[0.24em] uppercase opacity-45">
                          {when}
                        </dt>
                        <dd className="mt-1.5 font-garamond text-[16px] leading-[1.5] opacity-80">
                          {what}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="mt-6 border-l-2 border-[color:var(--script-red)] pl-4">
                  <p className="font-garamond text-[16px] leading-[1.55] opacity-70">
                    Not a pitch, just a correction or a note?{" "}
                    <Link href="/contact" className="underline underline-offset-4">
                      Write to us instead
                    </Link>{" "}
                    — it reaches the same person.
                  </p>
                </div>

                <p className="mt-6 font-garamond text-[15px] leading-[1.55] opacity-45">
                  This page stores nothing and sends nothing on its own. The
                  form hands a written draft to your own mail client, and the
                  send is yours.
                </p>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer sheet="var(--paper)" />
    </>
  );
}
