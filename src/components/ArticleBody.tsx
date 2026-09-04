import Link from "next/link";

import type { ArticleView } from "@/lib/article-view";
import Markdown from "@/components/cms/Markdown";
import { formatDate } from "@/lib/archive";

/**
 * A piece, set for reading. Shared by the modal and the full page so the two
 * cannot drift into different typography for the same article.
 */
export default function ArticleBody({ article }: { article: ArticleView }) {
  return (
    <article className="px-6 pt-12 pb-12 sm:px-12 sm:pt-14 sm:pb-16">
      <header>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={`/categories/${article.category}`}
            className="font-pixel text-[14px] tracking-[0.02em] uppercase transition-opacity hover:opacity-70"
            style={{ color: article.hue }}
          >
            {article.categoryName}
          </Link>
          <span className="font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-45">
            {article.minutes} min read
          </span>
        </p>

        <h1 className="mt-6 font-pixel text-[clamp(1.5rem,4vw,2.6rem)] leading-[1.12] uppercase">
          {article.title}
        </h1>

        {article.dek && (
          <p className="mt-6 max-w-[52ch] font-garamond text-[19px] leading-[1.5] opacity-70 sm:text-[22px]">
            {article.dek}
          </p>
        )}

        <p className="mt-8 font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-45">
          {article.author}
          {article.date && ` · ${formatDate(article.date.slice(0, 10))}`}
        </p>

        <div
          aria-hidden
          className="mt-8 h-[3px] w-16"
          style={{ backgroundColor: article.hue }}
        />
      </header>

      {article.coverImageUrl && (
        // An Appwrite Storage URL on whatever endpoint the project is on, which
        // next/image would need configured as a remote host.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImageUrl}
          // Empty is the correct value for an undescribed decorative image —
          // a screen reader skips it rather than reading out a filename.
          alt={article.coverAlt}
          className="mt-10 block w-full"
          loading="lazy"
        />
      )}

      {article.body ? (
        <Markdown source={article.body} className="mt-10" />
      ) : (
        // An archive placeholder: headline, dek and byline exist, the body does
        // not. Saying so is better than an empty column that reads as a bug.
        <div className="mt-10 border-l-2 border-[color:var(--script-red)] pl-5">
          <p className="font-garamond text-[17px] leading-[1.6] opacity-70">
            This one is on the schedule but not yet filed. The desk lists a
            piece from the moment it is commissioned, so the archive shows what
            is coming rather than only what is finished.
          </p>
          <Link
            href="/submit"
            className="mt-5 inline-block font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-55 transition-opacity hover:opacity-100"
          >
            Think you should write it? →
          </Link>
        </div>
      )}
    </article>
  );
}
