"use client";

import { useEffect, useState } from "react";

/** Tracks a max-width media query, resolved on the first client render. */
export function useNarrow(maxWidth: number) {
  const [narrow, setNarrow] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(`(max-width: ${maxWidth}px)`).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [maxWidth]);

  return narrow;
}
