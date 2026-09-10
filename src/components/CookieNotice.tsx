"use client";

import Link from "next/link";

import type { Consent } from "@/lib/consent";

/**
 * The consent notice, in the magazine's own voice rather than a vendor's.
 *
 * It sits in the bottom corner instead of across the whole screen: there is one
 * cookie on this site and it only exists once you sign in, so the notice has no
 * business taking a page hostage before it can be read. Both answers are one
 * press, both are equally weighted, and neither is hidden behind a settings
 * panel — a decline that costs more clicks than an accept is not a choice.
 *
 * Rendered only when the answer is unknown; `SiteChrome` owns that state, so
 * the mail button beside it knows to step out of the way on a phone.
 */
export default function CookieNotice({
  onChoose,
}: {
  onChoose: (choice: Consent) => void;
}) {
  return (
    <section
      role="dialog"
      aria-labelledby="cookie-notice-title"
      className="cookie-notice fixed inset-x-4 bottom-4 z-50 max-w-[min(92vw,30rem)] border border-white/12 bg-[color:var(--ink)]/92 p-5 text-[color:var(--bone)] shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:inset-x-auto sm:left-6 sm:bottom-6 sm:p-6"
    >
      <p
        id="cookie-notice-title"
        className="font-arial text-[10px] font-bold tracking-[0.26em] uppercase opacity-50"
      >
        Cookies
      </p>

      <p className="mt-4 font-garamond text-[16px] leading-[1.35] opacity-85 sm:text-[17px]">
        Nothing on this site follows you. There are no analytics and no tracking
        pixels — the one cookie we set keeps you signed in, and only once you
        sign in. Films load from YouTube&rsquo;s cookie-free host, and only when
        you press play.
      </p>

      <p className="mt-3 font-garamond text-[15px] leading-[1.35] opacity-55">
        Say which you would rather have. Your answer stays in this browser.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onChoose("all")}
          className="glitch border border-white/70 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors hover:bg-white hover:text-[color:var(--ink)]"
          data-text="Accept"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => onChoose("essential")}
          className="border border-white/25 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase opacity-70 transition-opacity hover:opacity-100"
        >
          Essential only
        </button>

        <span className="flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] uppercase opacity-45">
          <Link
            href="/cookies"
            className="underline underline-offset-4 transition-opacity hover:opacity-100"
          >
            Cookies
          </Link>
          <Link
            href="/privacy"
            className="underline underline-offset-4 transition-opacity hover:opacity-100"
          >
            Data
          </Link>
        </span>
      </div>
    </section>
  );
}
