"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Ceiling on the computed size, in px. */
  max?: number;
  className?: string;
};

/**
 * Scales one line of type so it spans its container exactly. Children size
 * themselves in `em`, so a mixed-face lockup scales as a unit.
 */
export default function FitText({ children, max = 900, className }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const line = lineRef.current;
    if (!wrap || !line) return;

    let lastWidth = -1;

    const fit = (force = false) => {
      const avail = wrap.clientWidth;
      // the observer also fires on the height change our own resize causes —
      // bail unless the width actually moved
      if (!avail || (!force && avail === lastWidth)) return;
      lastWidth = avail;

      wrap.style.fontSize = "100px";
      const measured = line.getBoundingClientRect().width;
      if (!measured) return;
      wrap.style.fontSize = `${Math.min(max, (100 * avail) / measured)}px`;
    };

    fit(true);
    // the faces load async — remeasure once they land (guarded: the Font
    // Loading API is not universal)
    document.fonts?.ready?.then(() => fit(true));
    // and once more after a beat, in case that promise resolved early
    const t = setTimeout(() => fit(true), 600);

    const ro = new ResizeObserver(() => fit());
    ro.observe(wrap);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [children, max]);

  return (
    <div ref={wrapRef} className={`w-full ${className ?? ""}`}>
      <span ref={lineRef} className="inline-block whitespace-nowrap">
        {children}
      </span>
    </div>
  );
}
