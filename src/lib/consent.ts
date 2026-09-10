"use client";

import { useSyncExternalStore } from "react";

/**
 * What the reader told us about cookies, kept where every other preference on
 * this site is kept: in their own browser. There is no consent vendor behind
 * this, no identifier minted for it, and nothing sent anywhere — the record
 * exists only so the notice stops asking.
 *
 * `null` is an unanswered question, which is what the notice waits for.
 * `undefined` is the server, which cannot see a browser's storage at all.
 */
export type Consent = "all" | "essential";

const KEY = "glitch.consent.v1";

/** Read once and kept, so a snapshot never touches storage mid-render. */
let cached: Consent | null | undefined;
const listeners = new Set<() => void>();

function read(): Consent | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "all" || raw === "essential" ? raw : null;
  } catch {
    // Private mode, or storage blocked outright. Treated as unanswered: the
    // notice shows again, which is the honest failure of the two.
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

/**
 * The stored answer, or `undefined` on the server and through hydration.
 *
 * useSyncExternalStore rather than useState + useEffect: storage is only
 * legible on the client, so a lazy initialiser would make the first client
 * render disagree with the server HTML. This hydrates against the server
 * snapshot, then syncs — and picks up an answer given in another tab.
 */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab answering the same question. The value is re-read rather than
  // taken from the event, so a clear (newValue null) lands the same way.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== KEY) return;
    cached = read();
    onChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function snapshot(): Consent | null {
  if (cached === undefined) cached = read();
  return cached;
}

function serverSnapshot(): undefined {
  return undefined;
}

/** Records the choice. A write that throws is not worth breaking a page over. */
export function setConsent(choice: Consent): void {
  cached = choice;
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {
    /* nothing to fall back to, and nothing depends on it persisting */
  }
  emit();
}

/** Clears it, so the notice asks again. */
export function clearConsent(): void {
  cached = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* as above */
  }
  emit();
}
