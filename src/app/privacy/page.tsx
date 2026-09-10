import type { Metadata } from "next";

import LegalPage, { type Clause } from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Data policy — Glitch Decoded",
  description:
    "What this site knows about you, which is almost nothing, and what happens to the little it does hold.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "10 September 2026";

const CLAUSES: Clause[] = [
  {
    head: "Reading costs you nothing",
    body: [
      "You can read every piece in this archive without giving us anything and without us learning who you are. There is no analytics package on this site, no tracking pixel, no advertising network and no profile built from what you open. We could not tell you which article was read most this month, because nothing here counts.",
      "That is a design decision rather than an oversight, and it is written into the manifesto: a magazine that measures you starts publishing for the measurement.",
    ],
  },
  {
    head: "What the server sees",
    body: [
      "Serving a page requires answering a request, and the host that answers it keeps ordinary server logs for a short period — the address the request came from, the page asked for, the time, and the browser's own description of itself. That is the technical minimum for delivering a website and defending it from abuse. We do not mine those logs, join them to anything, or use them to build a picture of a reader.",
    ],
  },
  {
    head: "If you sign up",
    body: [
      "An account is optional, and only editors and contributors need one. Creating one stores the details you type — your name, your email address, and a password we never see in the clear, because authentication is handled by our accounts provider rather than by us.",
      "While you are signed in, one cookie holds your session. It is described in full on the cookie page.",
    ],
  },
  {
    head: "If you write to us or send us something",
    body: [
      "Mail sent to the desk lives in a mailbox, the way mail does. A pitch or a correction is kept as long as it is useful — a piece we commission keeps its correspondence for as long as the piece is published; a pitch we pass on is deleted within a year.",
      `The contact and pitch forms on this site do not transmit anything themselves. They compose a message and hand the draft to your own mail client, which is why the send button opens your mail app. Nothing is stored by this page in between. You can always skip the form and write directly to ${CONTACT_EMAIL}.`,
    ],
  },
  {
    head: "The note board",
    body: [
      "The notes on the board are the magazine's own, written by the desk. A note you pin yourself is held by your browser and never sent to us — there is no endpoint behind it, so there is nothing for us to keep, read or hand over.",
      "Clearing your browser's data for this site clears your notes with it. We cannot restore one, because we never had it.",
    ],
  },
  {
    head: "The few third parties",
    body: [
      "Four, and they are all doing a job you can see:",
      [
        "Our hosting provider, which serves the pages and keeps the logs described above.",
        "Our accounts provider, which holds sign-in details for people who have an account.",
        "Object storage, which holds the pictures the magazine publishes.",
        "YouTube, for the film archive: stills are served from its image host, and the player itself is built on youtube-nocookie.com, only once you press play.",
      ],
      "Editorial drafts written in the newsroom are passed to a language-model provider when a writer asks for help with them. That is editorial text — never a reader's data, never the contents of your mail, and never anything from a pinned note.",
      "We do not sell data. There is no data to sell, and no arrangement under which anybody could buy it.",
    ],
  },
  {
    head: "What you can ask for",
    body: [
      "Wherever you live, and regardless of which law happens to cover you, you may ask us to:",
      [
        "Tell you what we hold about you, and give you a copy.",
        "Correct anything that is wrong.",
        "Delete it — an account, a note, an old exchange, all of it.",
        "Stop using it for anything you object to.",
      ],
      `One email to ${CONTACT_EMAIL} is the whole procedure. There is no form, no verification maze and no department to be transferred to. We answer within thirty days, usually within the week.`,
    ],
  },
  {
    head: "Children",
    body: [
      "This site is written for adults and is not directed at children. We do not knowingly hold an account for anyone under sixteen. If you believe a child has given us something, write and it will be removed.",
    ],
  },
  {
    head: "When this changes",
    body: [
      "If this policy changes, the date at the top changes with it, and anything material is said plainly on the page rather than buried in a revision. We do not have a mailing list to notify, which is itself a consequence of the first clause.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Data policy"
      title="What we know about you"
      dek="Almost nothing, on purpose. Here is the whole of it, in the order it matters."
      updated={UPDATED}
      clauses={CLAUSES}
      also={[
        { label: "Cookies", href: "/cookies" },
        { label: "Terms", href: "/terms" },
      ]}
    />
  );
}
