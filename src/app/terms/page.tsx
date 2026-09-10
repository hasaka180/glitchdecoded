import type { Metadata } from "next";

import LegalPage, { type Clause } from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Terms of use — Glitch Decoded",
  description:
    "What you may do with what you read here, what happens to what you send us, and what we do not promise.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "10 September 2026";

const CLAUSES: Clause[] = [
  {
    head: "Using the magazine",
    body: [
      "Glitch Decoded is published for readers. Read it, quote it, argue with it, teach from it, send it to somebody. Using the site means accepting what is on this page, which is the shortest version we could write and still be clear.",
    ],
  },
  {
    head: "Who owns the writing",
    body: [
      "Every piece belongs to the person who wrote it. Contributors are paid on acceptance and keep their own copyright — the archive is theirs as much as ours, and a piece is never quietly reassigned.",
      "You may quote a piece with attribution and a link, as any review or argument does. Republishing one whole, translating it, or putting it inside a paid product needs permission first, and it is usually given: write to the desk and say where it is going.",
      "Photographs and film stills are licensed to us for use in the piece they appear in. That licence does not travel with the text, so a picture is never cleared by the same email that clears the words.",
    ],
  },
  {
    head: "What you send us",
    body: [
      "A pitch, a draft, a correction or a tip stays yours. Sending it gives us permission to read it, discuss it internally and reply to it — nothing else. We do not acquire the right to publish anything you send unless we commission it and agree the terms with you in writing.",
      "Send us only what is yours to send, and do not send confidential material you are not free to share.",
    ],
  },
  {
    head: "The note board",
    body: [
      "The board carries the desk's own notes. A note you pin stays in your own browser — pinning does not publish anything and does not send us a thing, so nothing you write there is ours to keep or to moderate.",
      "Should the board ever open to readers, that changes enough to be said plainly on this page first, rather than arriving as a quiet edit to a clause.",
    ],
  },
  {
    head: "Accounts",
    body: [
      "An account is for the people who make the magazine. Keep the password to yourself, tell us if it goes astray, and do not use somebody else's. We can suspend an account that is being used to break these terms, and you can close yours by asking.",
    ],
  },
  {
    head: "What we get wrong",
    body: [
      "Journalism is written under uncertainty, and some of it will be wrong. When a fact is wrong we fix it in the piece and log the fix at the foot of it, with the date and what changed. When the error goes to the substance of an argument the note goes at the top.",
      `Nothing here is legal, medical or financial advice, and nothing on this site should be acted on as though it were. The archive is offered as it is, without a warranty that any of it is complete, current or fit for a purpose you have in mind. To the extent the law allows, we are not liable for what follows from relying on it — which is not a shrug, only the difference between a magazine and a professional you have hired. Tell us when we are wrong: ${CONTACT_EMAIL}.`,
    ],
  },
  {
    head: "Links out",
    body: [
      "We link to sources, and sources are other people's websites. What happens on them is theirs — their content, their terms and their cookies. A link is a citation, not an endorsement, and a source we cite today may change under us tomorrow.",
    ],
  },
  {
    head: "When this changes",
    body: [
      "These terms can change as the magazine does. The date at the top moves when they do, and continuing to use the site after that is how the new version is accepted. Anything material gets said plainly rather than slipped into a clause.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of use"
      title="The short version, in full"
      dek="What you may do with what you read here, what stays yours when you send us something, and what we do not promise."
      updated={UPDATED}
      clauses={CLAUSES}
      also={[
        { label: "Data policy", href: "/privacy" },
        { label: "Cookies", href: "/cookies" },
      ]}
    />
  );
}
