/**
 * The twenty topics, in the order the field drifts them.
 *
 * One source of truth, the way `categories.ts` is for the six perspectives: the
 * home page's field, the tagger that reads a piece, the editor's chips and the
 * `/topics` pages all read from here, so a name or a colour is changed once.
 *
 * A topic is not a category. A piece runs under exactly one perspective and
 * carries as many topics as it is actually about.
 */

export type Topic = {
  /** URL segment, and what is stored on the article row. */
  slug: string;
  name: string;
  /** One line, shown on hover in the field and under the topic page's title. */
  blurb: string;
  /** Accent used for the sprite and the page's rule. */
  hue: string;
  /**
   * An 11x11 bitmap — '#' is a lit pixel, '.' is empty. Drawn as SVG rather
   * than shipped as files so it stays crisp at any size and takes the topic's
   * own colour.
   */
  rows: string[];
};

export const TOPICS: Topic[] = [
  {
    name: "Loneliness",
    slug: "loneliness",
    blurb: "The room can be full and still be empty.",
    hue: "#2f47a0",
    rows: [
      "....###....",
      "....###....",
      "...........",
      "...#####...",
      "..#.###.#..",
      "..#.###.#..",
      "....###....",
      "....#.#....",
      "....#.#....",
      "###########",
      "...........",
    ],
  },
  {
    name: "Death",
    slug: "death",
    blurb: "The one certainty we plan around and never plan for.",
    hue: "#2a2a33",
    rows: [
      "...#####...",
      "..#######..",
      ".#########.",
      ".#..###..#.",
      ".#..###..#.",
      ".####.####.",
      ".#########.",
      "..#######..",
      "..#.#.#.#..",
      "..#######..",
      "...........",
    ],
  },
  {
    name: "Envy",
    slug: "envy",
    blurb: "The quiet arithmetic of comparing lives.",
    hue: "#2f6b3a",
    rows: [
      "...........",
      "...........",
      "....###....",
      "..##...##..",
      ".#..###..#.",
      "#..#####..#",
      ".#..###..#.",
      "..##...##..",
      "....###....",
      "...........",
      "...........",
    ],
  },
  {
    name: "Failure",
    slug: "failure",
    blurb: "The teacher nobody signs up for.",
    hue: "#a4541a",
    rows: [
      "....###....",
      "....###....",
      "....###....",
      "....###....",
      "...........",
      "...........",
      ".#########.",
      "..#######..",
      "...#####...",
      "....###....",
      ".....#.....",
    ],
  },
  {
    name: "Aging",
    slug: "aging",
    blurb: "Becoming a stranger to a body you have always lived in.",
    hue: "#5c4530",
    rows: [
      ".....#.....",
      "....###....",
      "....###....",
      ".....#.....",
      "...........",
      "...#####...",
      "...#...#...",
      "...#...#...",
      "...#...#...",
      "..#######..",
      "...........",
    ],
  },
  {
    name: "Money",
    slug: "money",
    blurb: "The thing we measure everything else against.",
    hue: "#2f6b3a",
    rows: [
      "...........",
      ".#########.",
      ".#...#...#.",
      ".#..###..#.",
      ".#.#.#...#.",
      ".#..###..#.",
      ".#....#..#.",
      ".#..###..#.",
      ".#...#...#.",
      ".#########.",
      "...........",
    ],
  },
  {
    name: "Meaning",
    slug: "meaning",
    blurb: "The question that outlives every answer.",
    hue: "#126b7d",
    rows: [
      ".....#.....",
      ".....#.....",
      "....###....",
      ".#.#####.#.",
      "..#######..",
      "###########",
      "..#######..",
      ".#.#####.#.",
      "....###....",
      ".....#.....",
      "...........",
    ],
  },
  {
    name: "Regret",
    slug: "regret",
    blurb: "The conversations we keep having alone.",
    hue: "#5a3f9c",
    rows: [
      "..##.......",
      ".#..#......",
      ".#..#......",
      "..##.......",
      "...#.......",
      "...##......",
      "....#......",
      "....#..#...",
      "....#.##...",
      "....#......",
      "..#######..",
    ],
  },
  {
    name: "Time",
    slug: "time",
    blurb: "The only currency you cannot earn back.",
    hue: "#86701a",
    rows: [
      ".#########.",
      ".#.......#.",
      "..#.....#..",
      "...#...#...",
      "....#.#....",
      ".....#.....",
      "....#.#....",
      "...#.#.#...",
      "..#..#..#..",
      ".#..###..#.",
      ".#########.",
    ],
  },
  {
    name: "Friendship",
    slug: "friendship",
    blurb: "The love we assume will look after itself.",
    hue: "#a4541a",
    rows: [
      ".##.....##.",
      ".##.....##.",
      "...........",
      ".###...###.",
      ".#########.",
      ".###...###.",
      ".#.#...#.#.",
      ".#.#...#.#.",
      "...........",
      "...........",
      "...........",
    ],
  },
  {
    name: "Desire",
    slug: "desire",
    blurb: "The engine and the trap, usually at once.",
    hue: "#b3162a",
    rows: [
      ".....#.....",
      "....###....",
      "....###....",
      "...#####...",
      "..#######..",
      "..##...##..",
      ".##.....##.",
      ".##..#..##.",
      ".##.###.##.",
      "..#######..",
      "...#####...",
    ],
  },
  {
    name: "Identity",
    slug: "identity",
    blurb: "Who you are when nobody is keeping score.",
    hue: "#126b7d",
    rows: [
      "...........",
      "...#####...",
      "..#.....#..",
      ".#..###..#.",
      ".#.#...#.#.",
      ".#.#.#.#.#.",
      ".#.#...#.#.",
      ".#..###..#.",
      "..#.....#..",
      "...#.#.#...",
      "...........",
    ],
  },
  {
    name: "Purpose",
    slug: "purpose",
    blurb: "Less a destination than a direction.",
    hue: "#b3162a",
    rows: [
      "....#####..",
      "....#...#..",
      "....#####..",
      "....#......",
      "....#......",
      "....#......",
      "....#......",
      "...........",
      "..#######..",
      ".#########.",
      "###########",
    ],
  },
  {
    name: "Shame",
    slug: "shame",
    blurb: "The story you would never tell out loud.",
    hue: "#5a3f9c",
    rows: [
      "....###....",
      "...#####...",
      "..#######..",
      "..##...##..",
      "..##...##..",
      "..#######..",
      "...#####...",
      "....###....",
      "....###....",
      "...#####...",
      "...........",
    ],
  },
  {
    name: "Forgiveness",
    slug: "forgiveness",
    blurb: "Often less about them than about you.",
    hue: "#86701a",
    rows: [
      "..#.#.#....",
      ".##.#.#.#..",
      ".##.#.#.##.",
      ".#########.",
      ".#########.",
      ".#########.",
      "..#######..",
      "...#####...",
      "....###....",
      "...........",
      "...........",
    ],
  },
  {
    name: "Grief",
    slug: "grief",
    blurb: "Love with nowhere left to go.",
    hue: "#2f47a0",
    rows: [
      "...#####...",
      "..#######..",
      ".#########.",
      "###########",
      ".#########.",
      "...........",
      "..#..#..#..",
      "..#..#..#..",
      "...........",
      "...#..#....",
      "...#..#....",
    ],
  },
  {
    name: "Change",
    slug: "change",
    blurb: "The thing we ask for and resist arriving.",
    hue: "#126b7d",
    rows: [
      ".##.....##.",
      "####.#.####",
      "###########",
      "####.#.####",
      ".##..#..##.",
      "..#..#..#..",
      ".....#.....",
      "...........",
      "...........",
      "...........",
      "...........",
    ],
  },
  {
    name: "Creativity",
    slug: "creativity",
    blurb: "Making something where nothing was owed.",
    hue: "#86701a",
    rows: [
      "....###....",
      "...#####...",
      "..##...##..",
      "..#.....#..",
      "..#.....#..",
      "..##...##..",
      "...#####...",
      "....###....",
      "....###....",
      "....#.#....",
      "....###....",
    ],
  },
  {
    name: "Work",
    slug: "work",
    blurb: "What we trade our hours for, and why.",
    hue: "#5c4530",
    rows: [
      "...........",
      "....###....",
      "...#...#...",
      ".#########.",
      ".#########.",
      ".####.####.",
      ".#########.",
      ".#########.",
      ".#########.",
      "...........",
      "...........",
    ],
  },
  {
    name: "Freedom",
    slug: "freedom",
    blurb: "Heavier to carry than it looks from outside.",
    hue: "#2f6b3a",
    rows: [
      "...........",
      "...........",
      ".##......#.",
      ".###....##.",
      ".####..###.",
      ".#########.",
      "..#######..",
      "...#####...",
      "....###....",
      ".....#.....",
      "...........",
    ],
  },
];

export function topicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug);
}

/** Display name for a slug, falling back to the slug itself. */
export function topicName(slug: string): string {
  return topicBySlug(slug)?.name ?? slug;
}

/** Narrows an untrusted string — a form field, a model's answer — to a topic. */
export function isTopicSlug(value: unknown): value is string {
  return typeof value === "string" && TOPICS.some((t) => t.slug === value);
}

/** Every slug, for the tagger's schema and the editor's chips. */
export const TOPIC_SLUGS = TOPICS.map((t) => t.slug);

/** How many topics one piece may carry. Past this it is about nothing. */
export const MAX_TOPICS = 4;
