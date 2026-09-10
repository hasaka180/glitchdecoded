import type { Metadata } from "next";

import LegalPage, { type Clause } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookies — Glitch Decoded",
  description:
    "The one cookie this site sets, when it sets it, and how to change your answer.",
  alternates: { canonical: "/cookies" },
};

const UPDATED = "10 September 2026";

const CLAUSES: Clause[] = [
  {
    head: "There is one cookie",
    body: [
      "It is called glitch_session, it holds nothing but a signed session token, and it is only set when you sign in. It exists so that the next page you open still knows you are signed in. It carries no name, no email address and no record of what you read, and it is gone when the session ends or when you sign out.",
      "If you never sign in — which is to say, if you are here to read the magazine — this site sets no cookie at all.",
    ],
  },
  {
    head: "What the notice actually stores",
    body: [
      "Your answer to the cookie notice is not a cookie. It is a single value kept in your browser's own local storage, under glitch.consent.v1, and it never leaves the machine you are reading on. It holds one word — accept or essential — and its only job is to stop the notice asking a question you have already answered.",
      "Clear your browser's site data and the answer goes with it, and the notice will ask again.",
    ],
  },
  {
    head: "What there is none of",
    body: [
      "No analytics cookie. No advertising or retargeting cookie. No social sharing widget setting one on the side, no tag manager, no fingerprinting, no pixel loaded from anywhere. Choosing accept over essential does not switch anything on, because there is nothing waiting behind it — the choice is recorded, and honoured if that ever changes.",
    ],
  },
  {
    head: "The film archive is the one third party",
    body: [
      "Stills in the video library are ordinary images served from YouTube's image host, which sets nothing. The player is built only when you press play, and it is built on youtube-nocookie.com — the host that does not set a cookie before playback.",
      "Once you press play you are watching a YouTube player, and YouTube's own terms and cookies apply to that playback. If you would rather that never happened, do not press play; the rest of the archive works without it.",
    ],
  },
  {
    head: "Changing your mind",
    body: [
      "Clear this site's data in your browser and the notice returns, letting you answer again. Every browser also lets you block or delete cookies for a site outright — nothing here breaks if you do, except staying signed in, which is what the cookie is for.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="One cookie, and only if you sign in"
      dek="The whole cookie policy fits on a page, because there is almost nothing to declare."
      updated={UPDATED}
      clauses={CLAUSES}
      also={[
        { label: "Data policy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ]}
    />
  );
}
