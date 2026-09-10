"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /**
   * Width of this line at font-size 1, i.e. `lineWidth / fontSize`, which is a
   * constant for a given string in a given face. It lets CSS arrive at the
   * final size on its own — see the note on the effect below.
   */
  ratio: number;
  /** Ceiling on the computed size, in px. */
  max?: number;
  className?: string;
};

/**
 * Scales one line of type so it spans its container exactly. Children size
 * themselves in `em`, so a mixed-face lockup scales as a unit.
 *
 * The size is arrived at twice. CSS gets there first, from `ratio` and the
 * container's own inline size, so the line is already the right size in the
 * very first frame the browser paints. The measurement below then corrects it
 * once the real faces have loaded.
 *
 * That order is the whole point. With only the measurement, the headline had
 * no size at all until the bundle had hydrated: it painted small, then jumped
 * to full size seconds later, and because that jump is a much larger paint,
 * the browser recorded it as the Largest Contentful Paint — 5.4s of "render
 * delay" on a page whose text was in the HTML from the start.
 */
export default function FitText({ children, ratio, max = 900, className }: Props) {
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
    // The shell is the container the line measures itself against, so `cqw`
    // below is exactly the space the line has to fill — no viewport or padding
    // arithmetic, and nothing to keep in step with the layout around it.
    <div className="fit-shell w-full">
      <div
        ref={wrapRef}
        className={`fit-text w-full ${className ?? ""}`}
        style={
          {
            "--fit-ratio": ratio,
            "--fit-max": `${max}px`,
          } as CSSProperties
        }
      >
        <span ref={lineRef} className="inline-block whitespace-nowrap">
          {children}
        </span>
      </div>
    </div>
  );
}
