import Link from "next/link";

import { type Article, formatDate } from "@/lib/archive";
import { categoryBySlug } from "@/lib/categories";

/**
 * A piece, as a card.
 *
 * The same object the recommended grid prints: a still cropped to fill, a fade
 * that is darkest where the copy sits, and the category's hue reaching only the
 * label and the top rule. Nothing here invents a second card language.
 *
 * The still is one frame of the category's existing six-frame sprite strip,
 * picked by hashing the slug — thirty-six combinations across the archive,
 * stable per piece, and no new image files to ship. It uses `.card-still`
 * rather than `.card-sprite`: the animated class would override the chosen
 * frame, and thirty cards running the same loop is noise, not motion.
 */
const FRAMES = 6;

/** FNV-1a. Small, stable, and identical on server and client. */
function hash(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function frameFor(slug: string): number {
  return hash(slug) % FRAMES;
}

export function articleHref(article: Pick<Article, "slug">): string {
  return `/read/${article.slug}`;
}

export default function ArticleCard({
  article,
  size = "default",
}: {
  article: Article;
  /** `lead` gives the card the display type and a wider crop. */
  size?: "default" | "lead";
}) {
  const category = categoryBySlug(article.category);
  const hue = category?.hue ?? "#9a9aa2";
  const lead = size === "lead";

  return (
    <article className="h-full">
      <Link
        href={articleHref(article)}
        scroll={false}
        className={`group pixel-corner relative flex h-full flex-col justify-end overflow-hidden bg-[#0b0a08] text-[color:var(--bone)] transition-transform duration-300 hover:-translate-y-1 ${
          lead ? "aspect-[16/10] p-6 sm:p-9" : "aspect-[4/5] p-5"
        }`}
      >
        {/* the still, one frame of the category strip */}
        <span
          aria-hidden
          className="card-still absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
          style={{
            backgroundImage: `url(/assets/categories/${article.category}.png)`,
            backgroundPositionX: `${(frameFor(article.slug) / (FRAMES - 1)) * 100}%`,
          }}
        />

        {/* darkest where the copy sits, so the type never fights the art */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(8,7,6,0.55) 0%, rgba(8,7,6,0.12) 30%, rgba(8,7,6,0.72) 68%, rgba(8,7,6,0.94) 100%)",
          }}
        />

        {/* a rule that runs the top edge as the card is picked up */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-[0.28] transition-transform duration-300 group-hover:scale-x-100"
          style={{ backgroundColor: hue }}
        />

        <div className="relative">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className="font-pixel text-[13px] tracking-[0.02em] uppercase"
              style={{ color: hue }}
            >
              {category?.name ?? article.category}
            </span>
            <span className="font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-55">
              {article.minutes} min
            </span>
          </p>

          <h3
            className={`mt-3 font-pixel uppercase leading-[1.15] ${
              lead
                ? "max-w-[20ch] text-[clamp(1.3rem,3vw,2.1rem)]"
                : "text-[16px] sm:text-[18px]"
            }`}
          >
            {article.title}
          </h3>

          <p
            className={`mt-3 font-garamond leading-[1.5] opacity-75 ${
              lead ? "max-w-[46ch] text-[17px] sm:text-[19px]" : "line-clamp-3 text-[15px]"
            }`}
          >
            {article.dek}
          </p>

          <p className="mt-4 font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-45">
            {article.author}
            <span aria-hidden className="px-2">
              ·
            </span>
            {formatDate(article.date)}
          </p>
        </div>
      </Link>
    </article>
  );
}

/** A grid of cards. One place decides the columns, so every listing matches. */
export function ArticleGrid({ articles }: { articles: Article[] }) {
  if (!articles.length) {
    return (
      <p className="border-t border-current/15 py-10 font-garamond text-[18px] leading-[1.55] opacity-50">
        Nothing published here yet. The desk is working on it.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <li key={article.slug}>
          <ArticleCard article={article} />
        </li>
      ))}
    </ul>
  );
}
