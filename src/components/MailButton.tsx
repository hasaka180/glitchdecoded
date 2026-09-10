"use client";

import { CONTACT_EMAIL } from "@/lib/contact";

/**
 * The desk, one press away from anywhere in the magazine.
 *
 * A mail link rather than a chat widget: nothing about this site talks to a
 * third party, and the reader's own client is the one place a half-written
 * message is safe. The label unrolls on hover and on focus, so the pointer
 * gets the affordance and the keyboard gets the same words.
 *
 * `lowered` is the cookie notice standing in the same corner on a phone. The
 * button steps aside there rather than being drawn on top of the notice, and
 * comes back the moment the notice is answered.
 */
export default function MailButton({ lowered = false }: { lowered?: boolean }) {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      aria-label={`Write to the desk — ${CONTACT_EMAIL}`}
      className={`group fixed right-4 bottom-4 z-40 flex items-center gap-0 overflow-hidden border border-white/15 bg-[color:var(--ink)]/88 py-3 pr-3 pl-3 text-[color:var(--bone)] shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-[transform,opacity,gap,padding,background-color] duration-300 hover:gap-2.5 hover:bg-[color:var(--ink)] focus-visible:gap-2.5 sm:right-6 sm:bottom-6 ${
        lowered
          ? "pointer-events-none translate-y-24 opacity-0 sm:pointer-events-auto sm:translate-y-0 sm:opacity-100"
          : ""
      }`}
    >
      {/* An envelope, drawn rather than fetched — one more icon set is one more
          request, and this is the only mark the shell needs. */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="size-5 shrink-0"
      >
        <rect x="2.5" y="5" width="19" height="14" />
        <path d="m2.5 6.5 9.5 7 9.5-7" />
      </svg>

      <span className="max-w-0 font-mono text-[11px] tracking-[0.2em] whitespace-nowrap uppercase opacity-0 transition-[max-width,opacity] duration-300 group-hover:max-w-[16rem] group-hover:opacity-90 group-focus-visible:max-w-[16rem] group-focus-visible:opacity-90">
        Write to the desk
      </span>
    </a>
  );
}
