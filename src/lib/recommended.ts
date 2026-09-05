/**
 * The picks under the topic field, and their shape.
 *
 * Lives outside the component so the grid can be filled from what the desk has
 * actually published, with these as the fallback: the section holds exactly
 * five — one featured and a 2x2 — and it would break rather than shorten if
 * fewer came back.
 */

export type Pick = {
  slug: string;
  title: string;
  dek: string;
  category: string;
  /** The topic from the field above that this pick answers to. */
  from: string;
  minutes: number;
  /** Accent for the label and the card's top rule. */
  hue: string;
  /**
   * Card image. Cropped to `cover`, so any aspect works — a piece the desk
   * published brings its own cover here.
   */
  image: string;
  /**
   * Pixel art wants `image-rendering: pixelated`; a photograph the desk
   * uploaded very much does not.
   */
  pixel: boolean;
  /**
   * Where the card goes. A published piece goes to itself; the picks shipped
   * below are illustrative and have no page behind them, so they stay the
   * anchors they have always been rather than becoming five 404s.
   */
  href: string;
};

export const PICKS: Pick[] = [
  {
    slug: "loneliness-that-doesnt-look-like-loneliness",
    href: "#loneliness-that-doesnt-look-like-loneliness",
    title: "The loneliness that doesn't look like loneliness",
    dek: "We built a century of ways to stay in touch and quietly lost the practice of being known. What went missing, and what it takes to get it back.",
    category: "Deep dives",
    from: "Loneliness",
    minutes: 14,
    hue: "#a98cf0",
    pixel: true,
    image: "/assets/recommended/loneliness-that-doesnt-look-like-loneliness.png",
  },
  {
    slug: "your-calendar-is-a-confession",
    href: "#your-calendar-is-a-confession",
    title: "Your calendar is a confession",
    dek: "What a life values isn't in the mission statement. It's in the diary.",
    category: "Reality check",
    from: "Time",
    minutes: 6,
    hue: "#e08a3c",
    pixel: true,
    image: "/assets/recommended/your-calendar-is-a-confession.png",
  },
  {
    slug: "ambition-is-envy-with-a-resume",
    href: "#ambition-is-envy-with-a-resume",
    title: "Ambition is envy with a résumé",
    dek: "The feeling we deny and the drive we admire turn out to be the same engine.",
    category: "Unpopular",
    from: "Envy",
    minutes: 8,
    hue: "#e8d24a",
    pixel: true,
    image: "/assets/recommended/ambition-is-envy-with-a-resume.png",
  },
  {
    slug: "the-friendships-nobody-ends",
    href: "#the-friendships-nobody-ends",
    title: "The friendships nobody ends",
    dek: "They are rarely broken off. They simply stop being maintained.",
    category: "Human",
    from: "Friendship",
    minutes: 5,
    hue: "#6fa8ef",
    pixel: true,
    image: "/assets/recommended/the-friendships-nobody-ends.png",
  },
  {
    slug: "nothing-in-a-forest-is-in-a-hurry",
    href: "#nothing-in-a-forest-is-in-a-hurry",
    title: "Nothing in a forest is in a hurry",
    dek: "On growth that never announces itself, and why we distrust it.",
    category: "Nature",
    from: "Change",
    minutes: 7,
    hue: "#8fce5a",
    pixel: true,
    image: "/assets/recommended/nothing-in-a-forest-is-in-a-hurry.png",
  },
];
