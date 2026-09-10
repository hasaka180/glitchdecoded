"use client";

import { useEffect } from "react";

/**
 * Stops the decorative animations in sections nobody is looking at.
 *
 * The page carries a dozen infinite animations — the CRT static, the roll bar,
 * the sprite walk, the drifting topics, the scanline sweep. They are cheap to
 * look at and expensive to run: measured on a phone-sized viewport sitting
 * still at the top of the page, they cost about 1.1s of style recalculation
 * every 5 seconds, and all of it lands during the load, when the browser is
 * also trying to paint the hero and hydrate. Most of it is spent on sections
 * that are thousands of pixels below the fold.
 *
 * So each section is watched, and the ones off screen get `data-offscreen`,
 * which globals.css turns into `animation-play-state: paused`. A paused
 * animation produces no new keyframe values, so it stops costing anything at
 * all until it scrolls back into view.
 *
 * Nothing here changes what the page looks like: without script the attribute
 * is never set and every animation runs exactly as before, and the margin below
 * means a section is already moving well before its first pixel is visible.
 */
export default function PauseOffscreen() {
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("main section");
    if (!sections.length || typeof IntersectionObserver !== "function") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) delete el.dataset.offscreen;
          else el.dataset.offscreen = "true";
        }
      },
      // Generous, so a section is running before it can be seen — the point is
      // to skip the ones far away, not to cut it fine at the viewport edge.
      { rootMargin: "400px 0px" },
    );

    for (const section of sections) io.observe(section);
    return () => io.disconnect();
  }, []);

  return null;
}
