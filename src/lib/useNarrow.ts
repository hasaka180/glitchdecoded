"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a max-width media query.
 *
 * useSyncExternalStore rather than useState + useEffect: the server has no
 * viewport, so a lazy matchMedia initialiser makes the first client render
 * disagree with the server HTML and React reports a hydration mismatch. This
 * hydrates against the server snapshot, then syncs.
 */
export function useNarrow(maxWidth: number) {
  const query = `(max-width: ${maxWidth}px)`;

  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
