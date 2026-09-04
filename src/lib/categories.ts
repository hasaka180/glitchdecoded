/**
 * The six perspectives, in the order the rail walks them.
 *
 * One source of truth: the home page's rail, the category pages, the nav menu
 * and the footer all read from here, so a hue or a name is changed once.
 */
/** The slugs, as a union — the pipeline validates incoming categories against it. */
export type CategorySlug =
  | "unpopular"
  | "untold"
  | "reality-check"
  | "deep-dives"
  | "nature"
  | "human";

export type Category = {
  slug: CategorySlug;
  name: string;
  /** One line, used on the card and under the category page's title. */
  blurb: string;
  /** The longer statement of what the category is for. */
  standfirst: string;
  /** Accent used for the label and the card's light. */
  hue: string;
  /** Two stops for the card's ground. */
  from: string;
  to: string;
  /**
   * Art drawn under the gradient with `image-rendering: pixelated`. The files
   * are deliberately tiny (~240px wide) — the upscale is what makes the blocks.
   */
  image?: string;
};

export const CATEGORIES: Category[] = [
  {
    slug: "unpopular",
    name: "Unpopular",
    image: "/assets/categories/unpopular.png",
    blurb: "Ideas worth considering, even when they're uncomfortable.",
    standfirst:
      "Positions that reliably empty a room, argued properly. Not for the heat — a view nobody defends in public is usually one nobody has examined in public either, and the examination is the part worth reading.",
    hue: "#e8d24a",
    from: "#3a3324",
    to: "#0b0a08",
  },
  {
    slug: "untold",
    name: "Untold",
    image: "/assets/categories/untold.png",
    blurb: "Stories and truths that don't get enough attention.",
    standfirst:
      "Slow, local, unresolved, or happening to people with no reach. Most of what goes untold is not hidden — it is simply boring to a feed, which is a different problem and a fixable one.",
    hue: "#4fd0e0",
    from: "#13323f",
    to: "#050f16",
  },
  {
    slug: "reality-check",
    name: "Reality check",
    image: "/assets/categories/reality-check.png",
    blurb: "Things we've accepted without ever asking why.",
    standfirst:
      "The number quoted everywhere that nobody has traced. The consensus with no origin. The arrangement everyone calls normal because it arrived before they did.",
    hue: "#e08a3c",
    from: "#43301c",
    to: "#120c06",
  },
  {
    slug: "deep-dives",
    name: "Deep dives",
    image: "/assets/categories/deep-dives.png",
    blurb: "Long-form explorations into life, society, mind and existence.",
    standfirst:
      "The pieces that need the length. One question, followed all the way down, with the working shown and the dead ends left in.",
    hue: "#a98cf0",
    from: "#241f3d",
    to: "#0a0813",
  },
  {
    slug: "nature",
    name: "Nature",
    image: "/assets/categories/nature.png",
    blurb: "Lessons, harmony and perspective from the natural world.",
    standfirst:
      "Not nature writing as scenery. What the rest of the living world is doing about time, scale, decay and repair — and what it looks like to take that seriously.",
    hue: "#8fce5a",
    from: "#22341d",
    to: "#080d06",
  },
  {
    slug: "human",
    name: "Human",
    image: "/assets/categories/human.png",
    blurb: "The beautiful, messy business of being human.",
    standfirst:
      "Grief, envy, boredom, love, the small humiliations nobody writes down. The interior weather everyone has and almost nobody reports on.",
    hue: "#6fa8ef",
    from: "#1d2a3d",
    to: "#070b11",
  },
];

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/**
 * Display name for a slug, falling back to the slug itself. Rows written before
 * a category was renamed should still render as something rather than blank.
 */
export function categoryName(slug: string): string {
  return categoryBySlug(slug)?.name ?? slug;
}

/** Accent for a slug. Falls back to the neutral used for an unknown state. */
export function categoryHue(slug: string): string {
  return categoryBySlug(slug)?.hue ?? "#9a9aa2";
}

/** Narrows an untrusted string — a form field, a URL segment — to a real slug. */
export function isCategorySlug(value: unknown): value is CategorySlug {
  return (
    typeof value === "string" && CATEGORIES.some((c) => c.slug === value)
  );
}
