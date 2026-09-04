"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * The shell a piece opens into when it is reached from a listing.
 *
 * The URL is real — this is an intercepted route, so the address bar reads
 * `/read/<slug>` and the link is shareable. Closing goes back to the listing
 * underneath rather than pushing a new entry, so the back button behaves the
 * way the close button does.
 *
 * A hard load of the same URL bypasses interception entirely and renders the
 * full page instead, which is why the modal only ever holds presentation.
 */
export default function ArticleModal({
  children,
  hue,
}: {
  children: React.ReactNode;
  hue: string;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreTo = useRef<Element | null>(null);

  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    restoreTo.current = document.activeElement;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);

    // The page behind must not scroll under the overlay. Its offset is held so
    // the listing is where it was when the modal closes.
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      (restoreTo.current as HTMLElement | null)?.focus?.();
    };
  }, [close]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:p-8"
    >
      {/* The ground behind. Ink at low opacity rather than a flat black wash —
          the listing stays legible underneath, which is the point of opening
          over it instead of navigating away. */}
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="fixed inset-0 -z-10 cursor-default bg-[color:var(--ink-brown)]/55 backdrop-blur-[3px]"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="paper pixel-corner relative my-auto w-full max-w-[52rem] text-[color:var(--ink-brown)] outline-none"
        style={{ boxShadow: "0 40px 90px -30px rgba(20,15,10,0.7)" }}
      >
        {/* the category's hue, running the top edge the way a card's rule does */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[4px]"
          style={{ backgroundColor: hue }}
        />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="pixel-corner-sm absolute top-5 right-5 z-10 flex size-9 items-center justify-center border border-[color:var(--ink-brown)]/25 bg-[color:var(--paper)]/80 text-[15px] leading-none transition-colors hover:bg-[color:var(--ink-brown)] hover:text-[color:var(--paper)]"
        >
          <span aria-hidden>✕</span>
        </button>

        {children}
      </div>
    </div>
  );
}
