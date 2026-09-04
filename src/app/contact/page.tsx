import type { Metadata } from "next";
import Link from "next/link";

import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import PageMasthead from "@/components/PageMasthead";
import PaperTear from "@/components/PaperTear";
import SocialLinks from "@/components/SocialLinks";

export const metadata: Metadata = {
  title: "Contact us — Glitch Decoded",
  description:
    "Where to send a correction, a rights query, a press request, or a note to the desk.",
};

const DIRECT: { label: string; address: string; line: string }[] = [
  {
    label: "The desk",
    address: "hello@glitchdecoded.com",
    line: "Anything at all. One person reads it, usually within the week.",
  },
  {
    label: "Corrections",
    address: "hello@glitchdecoded.com?subject=Correction",
    line: "Point at the sentence and say what it should say. Sources welcome.",
  },
  {
    label: "Rights",
    address: "hello@glitchdecoded.com?subject=Rights",
    line: "Translation, syndication, or using a piece in teaching.",
  },
];

export default function ContactPage() {
  return (
    <>
      <main className="flex-1">
        <PageMasthead
          eyebrow="Take part"
          title="Contact us"
          dek="No contact form that vanishes into a ticketing system. One address, read by the person who edits the magazine."
          rule={false}
        />



        {/* The masthead's dark band coming away to uncover the stock the
            section is printed on. */}
        <PaperTear sheet="var(--ink)" ground="var(--paper)" />

        <section className="paper relative isolate text-[color:var(--ink-brown)]">
          <div className="mx-auto w-full max-w-[1400px] px-5 py-16 sm:px-10 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16">
              <div>
                <h2 className="font-pixel text-[clamp(1.4rem,3.2vw,2rem)] leading-[1.15] uppercase">
                  Write to the desk
                </h2>
                <p className="mt-4 max-w-[52ch] font-garamond text-[17px] leading-[1.6] opacity-65">
                  Say what you actually mean. There is no triage tier and no
                  auto-reply — the message goes to a person, and the person
                  answers it.
                </p>

                <div className="mt-9">
                  <ContactForm />
                </div>
              </div>

              <aside className="lg:pt-2">
                <div className="border border-[color:var(--ink-brown)]/20 bg-white/50 p-6 sm:p-7">
                  <p className="font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-55">
                    Or write directly
                  </p>

                  <dl className="mt-6 space-y-6">
                    {DIRECT.map(({ label, address, line }) => (
                      <div key={label}>
                        <dt className="font-mono text-[9px] tracking-[0.24em] uppercase opacity-45">
                          {label}
                        </dt>
                        <dd className="mt-1.5">
                          <a
                            href={`mailto:${address}`}
                            className="font-garamond text-[17px] leading-[1.4] underline underline-offset-4 opacity-85 transition-opacity hover:opacity-100"
                          >
                            {address.split("?")[0]}
                          </a>
                          <p className="mt-1 font-garamond text-[15px] leading-[1.45] opacity-55">
                            {line}
                          </p>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Where the post would go, if anybody sent any. */}
                <div className="mt-6 border border-[color:var(--ink-brown)]/20 bg-white/50 p-6 sm:p-7">
                  <p className="font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-55">
                    Where we are
                  </p>
                  <address className="mt-4 font-garamond text-[17px] leading-[1.5] not-italic opacity-85">
                    Dubai, United Arab Emirates
                  </address>
                  <p className="mt-1.5 font-garamond text-[15px] leading-[1.45] opacity-55">
                    Written from GMT+4, which is why a reply sometimes lands
                    while your part of the world is asleep.
                  </p>

                  <p className="mt-6 font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-55">
                    Elsewhere
                  </p>
                  <SocialLinks className="mt-4" />
                </div>

                <div className="mt-6 border-l-2 border-[color:var(--script-red)] pl-4">
                  <p className="font-garamond text-[16px] leading-[1.55] opacity-70">
                    Pitching a piece rather than writing to us? That one goes
                    through an account, so the draft stays yours while you work
                    on it:{" "}
                    <Link href="/submit" className="underline underline-offset-4">
                      sign in and submit a glitch
                    </Link>
                    .
                  </p>
                </div>

                <p className="mt-6 font-garamond text-[15px] leading-[1.55] opacity-45">
                  We keep correspondence only as long as it takes to answer it,
                  and never add an address to anything.
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
