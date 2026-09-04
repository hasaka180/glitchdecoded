import { CATEGORIES, categoryBySlug } from "@/lib/categories";

/**
 * The band of moving art behind a page's masthead.
 *
 * The same thing the home page's rail runs: the six-frame category strips on
 * `.card-sprite`, stepped with `steps(6, jump-none)` so they land on each frame
 * rather than sliding. Nothing new is loaded — these are the files the rail and
 * the article cards already use.
 *
 * Played at full strength, the way a card plays it. A fade over the top is what
 * keeps the type legible — the same job the cards give it — rather than washing
 * the art out until it is a texture.
 *
 * A page with a category shows that category. A page without one shows all six
 * as panels, which is the magazine rather than any one part of it.
 */
export default function MastheadArt({ category }: { category?: string }) {
  const single = category ? categoryBySlug(category) : undefined;
  const panels = single ? [single] : CATEGORIES;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex">
      {panels.map((entry) => (
        <span
          key={entry.slug}
          className="card-sprite relative h-full flex-1"
          style={{
            backgroundImage: `url(${entry.image})`,
            // Each panel a beat behind the one before it, so the band ripples
            // across rather than flashing in unison.
            animationDelay: `${CATEGORIES.indexOf(entry) * -0.28}s`,
          }}
        />
      ))}
    </div>
  );
}
