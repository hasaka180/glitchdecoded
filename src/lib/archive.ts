/**
 * The published archive, as the front of the site reads it.
 *
 * Written here rather than fetched: the Appwrite tables behind
 * `src/lib/articles/queries.ts` are still being built, and the category and
 * home pages need something to render meanwhile. Everything that lists a piece
 * goes through `articlesInCategory` / `recentArticles`, so switching this file
 * for those queries is one change in one place.
 *
 * Deliberately not `src/lib/articles.ts` — that name would sit ambiguously
 * beside the `src/lib/articles/` module the pipeline uses.
 */
import type { CategorySlug } from "./categories";

export type Article = {
  slug: string;
  category: CategorySlug;
  title: string;
  /** The standfirst under the headline. */
  dek: string;
  author: string;
  /** ISO date — the day it ran. */
  date: string;
  /** Reading time in minutes, as printed. */
  minutes: number;
  /** Set on the one piece per category that leads the page. */
  lead?: boolean;
};

export const ARTICLES: Article[] = [
  // ------------------------------------------------------------- unpopular --
  {
    slug: "in-defence-of-being-bored",
    category: "unpopular",
    title: "In defence of being bored",
    dek: "We have eliminated the last unfilled minute of the day and called it progress. Nearly everything worth thinking was thought in one of those minutes.",
    author: "The desk",
    date: "2026-08-19",
    minutes: 9,
    lead: true,
  },
  {
    slug: "closure-is-a-marketing-term",
    category: "unpopular",
    title: "Closure is a marketing term",
    dek: "Grief does not resolve, and telling people it should is how we abandon them at the point they most need company.",
    author: "M. Renner",
    date: "2026-07-30",
    minutes: 12,
  },
  {
    slug: "your-hobby-does-not-have-to-scale",
    category: "unpopular",
    title: "Your hobby does not have to scale",
    dek: "The moment a thing you love acquires an audience, it acquires a quota. Some things should stay unmonetisably bad.",
    author: "The desk",
    date: "2026-07-11",
    minutes: 6,
  },
  {
    slug: "against-the-morning-routine",
    category: "unpopular",
    title: "Against the morning routine",
    dek: "Optimising the first four hours of consciousness is not discipline. It is a way of never being asked what the other twenty are for.",
    author: "S. Adeyemi",
    date: "2026-06-24",
    minutes: 8,
  },
  {
    slug: "nobody-owes-you-their-trauma",
    category: "unpopular",
    title: "Nobody owes you their trauma",
    dek: "Somewhere between confession and content, we started demanding the worst thing that happened to a person as the price of hearing them at all.",
    author: "M. Renner",
    date: "2026-05-29",
    minutes: 11,
  },

  // ---------------------------------------------------------------- untold --
  {
    slug: "the-last-tape-library",
    category: "untold",
    title: "The last tape library",
    dek: "In a council basement in the north, one archivist has spent nineteen years transferring reels nobody has asked for. The funding ends in March.",
    author: "J. Okonjo",
    date: "2026-08-27",
    minutes: 14,
    lead: true,
  },
  {
    slug: "the-night-shift-nobody-counts",
    category: "untold",
    title: "The night shift nobody counts",
    dek: "Cleaners arrive after the badge readers stop logging and leave before they start. On paper, the building was empty all night.",
    author: "P. Varga",
    date: "2026-08-04",
    minutes: 16,
  },
  {
    slug: "what-the-river-took",
    category: "untold",
    title: "What the river took",
    dek: "Four villages, one flood, and a compensation scheme that closed to new claims eleven days before anyone downstream heard it existed.",
    author: "J. Okonjo",
    date: "2026-07-08",
    minutes: 18,
  },
  {
    slug: "the-men-who-fix-the-machines",
    category: "untold",
    title: "The men who fix the machines",
    dek: "Every automated warehouse has a small number of people who keep it running, and no plan at all for what happens when they retire.",
    author: "The desk",
    date: "2026-06-02",
    minutes: 13,
  },
  {
    slug: "a-school-with-one-pupil",
    category: "untold",
    title: "A school with one pupil",
    dek: "The island's roll fell to a single child. Closing the school would end the island. Nobody wanted to be the one to do the arithmetic.",
    author: "P. Varga",
    date: "2026-04-17",
    minutes: 10,
  },

  // ---------------------------------------------------------- reality-check --
  {
    slug: "the-eight-glasses-of-water",
    category: "reality-check",
    title: "The eight glasses of water",
    dek: "Traced back through forty years of citations, the advice everyone repeats arrives at a 1945 pamphlet whose next sentence nobody quotes.",
    author: "The desk",
    date: "2026-08-22",
    minutes: 7,
    lead: true,
  },
  {
    slug: "who-decided-the-working-week",
    category: "reality-check",
    title: "Who decided the working week",
    dek: "Five days is not a compromise between labour and capital. It is one industrialist's guess that outlived every condition that produced it.",
    author: "S. Adeyemi",
    date: "2026-07-25",
    minutes: 12,
  },
  {
    slug: "the-recycling-number",
    category: "reality-check",
    title: "The recycling number",
    dek: "The figure on the bin lid was never a promise about what happens next. It was a sorting instruction, and it has been doing other work ever since.",
    author: "J. Okonjo",
    date: "2026-06-30",
    minutes: 9,
  },
  {
    slug: "we-never-agreed-to-the-open-plan",
    category: "reality-check",
    title: "We never agreed to the open plan",
    dek: "Its inventors designed it for a specific kind of collaborative work, described the conditions it required, and watched every one of them get dropped.",
    author: "M. Renner",
    date: "2026-05-14",
    minutes: 8,
  },
  {
    slug: "the-average-person-does-not-exist",
    category: "reality-check",
    title: "The average person does not exist",
    dek: "An air force spent a decade building cockpits for a pilot with mean measurements. Out of four thousand men, not one of them fitted.",
    author: "The desk",
    date: "2026-03-26",
    minutes: 11,
  },

  // ------------------------------------------------------------ deep-dives --
  {
    slug: "the-long-now-of-a-forest",
    category: "deep-dives",
    title: "The long now of a forest",
    dek: "A stand of pine measures its life in fire intervals. Spending a year inside that clock changes what a decade feels like.",
    author: "P. Varga",
    date: "2026-08-13",
    minutes: 24,
    lead: true,
  },
  {
    slug: "an-anatomy-of-waiting",
    category: "deep-dives",
    title: "An anatomy of waiting",
    dek: "Queues, remand, diagnosis, immigration. Four systems, one shared design decision: make the delay invisible to everyone except the person inside it.",
    author: "S. Adeyemi",
    date: "2026-07-02",
    minutes: 27,
  },
  {
    slug: "where-attention-goes-to-die",
    category: "deep-dives",
    title: "Where attention goes to die",
    dek: "Not the feed. The forty small interfaces between you and the feed, each of which was optimised by someone who never met the next one.",
    author: "The desk",
    date: "2026-05-21",
    minutes: 21,
  },
  {
    slug: "the-second-life-of-concrete",
    category: "deep-dives",
    title: "The second life of concrete",
    dek: "Everything we have built this century is scheduled to fail inside the next one. A small profession is quietly deciding what happens then.",
    author: "J. Okonjo",
    date: "2026-04-09",
    minutes: 19,
  },
  {
    slug: "a-history-of-the-unfinished",
    category: "deep-dives",
    title: "A history of the unfinished",
    dek: "Cathedrals, symphonies, motorways, novels. What abandoned work tells us that completed work cannot.",
    author: "M. Renner",
    date: "2026-02-19",
    minutes: 23,
  },

  // ---------------------------------------------------------------- nature --
  {
    slug: "the-fungus-that-keeps-the-books",
    category: "nature",
    title: "The fungus that keeps the books",
    dek: "Underneath a hectare of woodland, an accounting system moves carbon between trees that have never touched. Nobody has found the ledger.",
    author: "P. Varga",
    date: "2026-08-08",
    minutes: 13,
    lead: true,
  },
  {
    slug: "what-the-tide-remembers",
    category: "nature",
    title: "What the tide remembers",
    dek: "Salt marsh rebuilds itself from the damage, but only in a particular order, and only if nothing helps.",
    author: "J. Okonjo",
    date: "2026-06-18",
    minutes: 10,
  },
  {
    slug: "the-slowest-animal-in-britain",
    category: "nature",
    title: "The slowest animal in Britain",
    dek: "It moves four metres a year, has outlived every road built near it, and is legally classified as scenery.",
    author: "The desk",
    date: "2026-05-06",
    minutes: 8,
  },
  {
    slug: "winter-is-not-a-pause",
    category: "nature",
    title: "Winter is not a pause",
    dek: "We read dormancy as an absence of work. Under the frost it is the most metabolically expensive thing the field does all year.",
    author: "P. Varga",
    date: "2026-01-29",
    minutes: 11,
  },
  {
    slug: "birdsong-in-a-loud-city",
    category: "nature",
    title: "Birdsong in a loud city",
    dek: "Urban populations have raised their pitch to be heard over traffic. Their songs no longer carry to the birds they came from.",
    author: "S. Adeyemi",
    date: "2025-11-20",
    minutes: 9,
  },

  // ----------------------------------------------------------------- human --
  {
    slug: "the-friendships-that-just-stop",
    category: "human",
    title: "The friendships that just stop",
    dek: "No argument, no decision, no last conversation you would recognise as the last one. The most common ending, and the one with no vocabulary.",
    author: "M. Renner",
    date: "2026-08-30",
    minutes: 10,
    lead: true,
  },
  {
    slug: "envy-is-information",
    category: "human",
    title: "Envy is information",
    dek: "The feeling we deny and the drive we admire turn out to be the same engine, read at two different distances.",
    author: "The desk",
    date: "2026-07-16",
    minutes: 9,
  },
  {
    slug: "the-things-we-keep-for-nobody",
    category: "human",
    title: "The things we keep for nobody",
    dek: "A drawer of objects with no use and no audience. What we are actually storing, and who we are storing it for.",
    author: "S. Adeyemi",
    date: "2026-06-11",
    minutes: 7,
  },
  {
    slug: "on-being-the-difficult-one",
    category: "human",
    title: "On being the difficult one",
    dek: "Every family assigns the role. It is rarely given to the most difficult person, and it is almost never taken back.",
    author: "M. Renner",
    date: "2026-04-28",
    minutes: 12,
  },
  {
    slug: "small-humiliations",
    category: "human",
    title: "Small humiliations",
    dek: "Not the catastrophes. The eight-second embarrassments from years ago that still arrive, fully formed, at three in the morning.",
    author: "The desk",
    date: "2026-03-05",
    minutes: 6,
  },
];

export function articlesInCategory(slug: string): Article[] {
  return ARTICLES.filter((a) => a.category === slug).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function recentArticles(limit: number): Article[] {
  return [...ARTICLES]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/** "19 August 2026" — the form the magazine prints dates in. */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
