import Link from "next/link";

import Footer from "@/components/Footer";
import PageMasthead from "@/components/PageMasthead";
import PaperTear from "@/components/PaperTear";
import { CONTACT_EMAIL } from "@/lib/contact";

/**
 * The shape the three policy pages share: masthead, tear, then one column of
 * numbered clauses on the magazine's own stock.
 *
 * Policy pages are usually where a site stops sounding like itself. These are
 * set in the same faces as everything else and written in the same voice,
 * because a document nobody can read is not a disclosure — and this one is
 * short enough to actually be read, which is the point.
 */
export type Clause = {
  head: string;
  /** Paragraphs. A nested array becomes a list, for the enumerable bits. */
  body: (string | string[])[];
};

function Body({ body }: { body: Clause["body"] }) {
  return (
    <div className="mt-4 max-w-[68ch] space-y-4 font-garamond text-[17px] leading-[1.45] opacity-75 sm:text-[18px]">
      {body.map((part, i) =>
        Array.isArray(part) ? (
          <ul key={i} className="space-y-2.5 pl-1">
            {part.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-[0.55em] size-1.5 shrink-0 bg-[color:var(--script-red)]"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>{part}</p>
        ),
      )}
    </div>
  );
}

type Props = {
  eyebrow: string;
  title: string;
  dek: string;
  /** Written out, not a timestamp — nobody parses this, they read it. */
  updated: string;
  clauses: Clause[];
  /** The other two policies, so each page is one hop from the rest. */
  also: { label: string; href: string }[];
};

export default function LegalPage({
  eyebrow,
  title,
  dek,
  updated,
  clauses,
  also,
}: Props) {
  return (
    <>
      <main className="flex-1">
        <PageMasthead eyebrow={eyebrow} title={title} dek={dek} rule={false} />

        {/* The masthead's dark band coming away to uncover the stock the
            clauses are printed on. */}
        <PaperTear sheet="var(--ink)" ground="var(--paper)" />

        <div className="paper relative isolate overflow-hidden text-[color:var(--ink-brown)]">
          <div className="relative mx-auto w-full max-w-[1400px] px-5 py-16 sm:px-10 sm:py-24">
            <p className="font-mono text-[10px] tracking-[0.24em] uppercase opacity-45">
              Last updated {updated}
            </p>

            <ol className="mt-12 space-y-12 sm:mt-16 sm:space-y-14">
              {clauses.map((clause, i) => (
                <li
                  key={clause.head}
                  className="border-t border-[color:var(--ink-brown)]/20 pt-6"
                >
                  <span
                    aria-hidden
                    className="font-mono text-[11px] tracking-[0.24em] text-[color:var(--script-red)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-3 max-w-[28ch] font-pixel text-[19px] leading-[1.1] tracking-[0.01em] uppercase sm:text-[24px]">
                    {clause.head}
                  </h2>
                  <Body body={clause.body} />
                </li>
              ))}
            </ol>

            <div className="mt-16 border-t border-[color:var(--ink-brown)]/20 pt-10 sm:mt-20">
              <h2 className="font-pixel text-[clamp(1.2rem,2.6vw,1.6rem)] leading-[1.1] uppercase">
                Ask us anything about this
              </h2>
              <p className="mt-4 max-w-[54ch] font-garamond text-[17px] leading-[1.45] opacity-70">
                One person reads that address, and a question about your own
                data goes to the front of the queue.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="glitch border border-[color:var(--ink-brown)]/70 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors hover:bg-[color:var(--ink-brown)] hover:text-[color:var(--paper)]"
                  data-text={CONTACT_EMAIL}
                >
                  {CONTACT_EMAIL}
                </a>

                {also.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="font-mono text-[11px] tracking-[0.2em] uppercase opacity-55 transition-opacity hover:opacity-100"
                  >
                    {label} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer sheet="var(--paper)" />
    </>
  );
}
