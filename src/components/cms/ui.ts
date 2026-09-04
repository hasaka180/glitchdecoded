/**
 * Shared control styling for the CMS screens.
 *
 * Kept as class strings rather than added to `globals.css`: the stylesheet is
 * given over to the front page's motion work, and the dashboard has no business
 * growing it.
 */

export const INPUT =
  "w-full bg-white/[0.04] px-4 py-3 font-garamond text-[17px] text-[color:var(--bone)] outline-none ring-1 ring-white/15 transition-[box-shadow,background-color] placeholder:opacity-35 focus:bg-white/[0.07] focus:ring-2 focus:ring-[color:var(--cyan)]";

export const LABEL =
  "mb-2 block font-arial text-[10px] font-bold tracking-[0.2em] uppercase opacity-55";

export const BUTTON_PRIMARY =
  "pixel-corner-sm inline-flex items-center justify-center gap-2 bg-[color:var(--bone)] px-6 py-3 font-arial text-[11px] font-bold tracking-[0.18em] text-[color:var(--ink)] uppercase transition-colors hover:bg-[color:var(--cyan)] disabled:cursor-not-allowed disabled:opacity-40";

export const BUTTON_GHOST =
  "pixel-corner-sm inline-flex items-center justify-center gap-2 bg-white/10 px-6 py-3 font-arial text-[11px] font-bold tracking-[0.18em] text-[color:var(--bone)] uppercase transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40";

export const BUTTON_DANGER =
  "pixel-corner-sm inline-flex items-center justify-center gap-2 bg-[color:var(--red-deep)] px-6 py-3 font-arial text-[11px] font-bold tracking-[0.18em] text-[color:var(--bone)] uppercase transition-colors hover:bg-[color:var(--red)] disabled:cursor-not-allowed disabled:opacity-40";

export const EYEBROW =
  "font-arial text-[10px] font-bold tracking-[0.3em] uppercase opacity-50";

/** Rendered under a form when an action comes back with a message. */
export const ERROR_BOX =
  "pixel-corner-sm bg-[color:var(--red-deep)]/25 px-4 py-3 font-garamond text-[16px] text-[color:var(--bone)] ring-1 ring-[color:var(--red)]/50";

/**
 * The sign-in and sign-up screens sit on paper rather than ink, so `INPUT`'s
 * bone text disappears there. Same geometry, inverted for a light ground.
 */
export const INPUT_LIGHT =
  "w-full bg-white/60 px-4 py-3 font-garamond text-[17px] text-[color:var(--ink-brown)] outline-none ring-1 ring-[color:var(--ink-brown)]/25 transition-[box-shadow,background-color] placeholder:opacity-40 focus:bg-white focus:ring-2 focus:ring-[color:var(--script-red)]";

/** `ERROR_BOX` for the same light ground — its bone text reads as blank there. */
export const ERROR_BOX_LIGHT =
  "pixel-corner-sm bg-[color:var(--red-deep)]/10 px-4 py-3 font-garamond text-[16px] text-[color:var(--red-deep)] ring-1 ring-[color:var(--red-deep)]/40";
