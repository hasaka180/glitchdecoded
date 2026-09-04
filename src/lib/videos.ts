/**
 * The video library.
 *
 * ADDING A VIDEO: paste the YouTube link into `url` — any form works
 * (`https://youtu.be/ID`, `https://www.youtube.com/watch?v=ID`,
 * `/shorts/ID`, `/embed/ID`). A reel with an empty `url` still lists and still
 * shows its title card; it simply reads as untransferred, which is the honest
 * state for an archive entry nobody has digitised yet.
 *
 * Thumbnails come from YouTube's still server, so a linked reel shows its own
 * frame. The player itself is only built when a reader presses play, and it is
 * the cookie-free host — so nothing sets a cookie or starts a session until
 * somebody actually watches something.
 */
export type Reel = {
  id: string;
  /** Who is speaking. */
  speaker: string;
  /** What the reel is about, in the magazine's voice — not a quotation. */
  line: string;
  /** Where the footage comes from. */
  source: string;
  year: string;
  /** Film stock marker, for the strip under the picture. */
  stock: string;
  /** Accent on the tube — lit, because it sits on black. */
  hue: string;
  /**
   * The same accent taken down for the graphite ground, where the lit one
   * would wash out.
   */
  inkHue: string;
  /** Paste the YouTube link here. Empty means "not transferred yet". */
  url: string;
  /** Runtime as printed in the programme, e.g. "38 min". Optional. */
  runtime?: string;
};

export const REELS: Reel[] = [
  {
    id: "jung",
    speaker: "Carl Jung",
    line: "On the part of a person that goes unlived, and what it costs to keep it that way.",
    source: "Face to Face, BBC",
    year: "1959",
    stock: "16mm · b/w",
    hue: "#d8b06a",
    inkHue: "#8a5a12",
    url: "",
  },
  {
    id: "watts",
    speaker: "Alan Watts",
    line: "On anxiety — and the security we keep chasing as the thing producing it.",
    source: "KQED broadcasts",
    year: "1960",
    stock: "16mm · b/w",
    hue: "#6fa8ef",
    inkHue: "#2f47a0",
    url: "",
  },
  {
    id: "frankl",
    speaker: "Viktor Frankl",
    line: "On meaning as the one thing that survives a life it was not given.",
    source: "Recorded lecture",
    year: "1972",
    stock: "video · colour",
    hue: "#e08a3c",
    inkHue: "#a4541a",
    url: "",
  },
  {
    id: "fromm",
    speaker: "Erich Fromm",
    line: "On loneliness inside a society that calls itself well.",
    source: "The Mike Wallace Interview",
    year: "1958",
    stock: "16mm · b/w",
    hue: "#a98cf0",
    inkHue: "#4a3a8e",
    url: "",
  },
  {
    id: "krishnamurti",
    speaker: "J. Krishnamurti",
    line: "On fear, and the difficulty of watching your own mind without flinching.",
    source: "Ojai talks",
    year: "1974",
    stock: "16mm · colour",
    hue: "#8fce5a",
    inkHue: "#2f6b3a",
    url: "",
  },
  {
    id: "russell",
    speaker: "Bertrand Russell",
    line: "On the habits of thought that make a person miserable and pass for wisdom.",
    source: "Face to Face, BBC",
    year: "1959",
    stock: "16mm · b/w",
    hue: "#e8d24a",
    inkHue: "#7a6410",
    url: "",
  },
];

/**
 * Pulls the eleven-character id out of any YouTube link shape. Returns null for
 * an empty field or a link that is not YouTube, which the player reads as "no
 * transfer" rather than as an error.
 */
export function youtubeId(url: string): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    // A bare id pasted on its own is a reasonable thing to have typed.
    return /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  const id =
    host === "youtu.be"
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v") ??
        parsed.pathname.match(/\/(?:embed|shorts|v|live)\/([\w-]{11})/)?.[1] ??
        "";

  return /^[\w-]{11}$/.test(id) ? id : null;
}

/**
 * The still YouTube publishes for a video, used as the card's thumbnail.
 * `hqdefault` exists for every video; the sharper `maxresdefault` does not.
 */
export function thumbnailSrc(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** The cookie-free player, only ever built after the reader presses play. */
export function embedSrc(id: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

export function watchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
