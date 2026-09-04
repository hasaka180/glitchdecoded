import type { Metadata } from "next";
import Link from "next/link";

import Markdown from "@/components/cms/Markdown";
import ReviewDecision from "@/components/cms/ReviewDecision";
import StatusPill from "@/components/cms/StatusPill";
import { EYEBROW } from "@/components/cms/ui";
import { listDecided, listReviewQueue } from "@/lib/articles/queries";
import type { ArticleRow } from "@/lib/articles/types";
import { requireSuperadmin } from "@/lib/auth/dal";
import { categoryHue, categoryName } from "@/lib/categories";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Review queue — The desk",
  robots: { index: false, follow: false },
};

/**
 * One submission, opened.
 *
 * The whole piece is rendered inline rather than behind a link: a reviewer who
 * has to open a second tab to read before ruling will rule without reading.
 */
function Submission({ article }: { article: ArticleRow }) {
  const hue = categoryHue(article.category);

  return (
    <li className="pixel-corner relative bg-white/[0.03] p-6 sm:p-10">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: hue }}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className="font-pixel text-[13px] tracking-[0.02em] uppercase"
          style={{ color: hue }}
        >
          {categoryName(article.category)}
        </span>
        <StatusPill status={article.status} />
        <span className="ml-auto font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-40">
          {article.authorName} · submitted {formatDateTime(article.submittedAt)}
        </span>
      </div>

      <h2 className="mt-4 font-display text-[28px] leading-[1.15] font-semibold sm:text-[34px]">
        {article.title}
      </h2>

      {article.dek && (
        <p className="mt-3 max-w-[60ch] font-garamond text-[18px] leading-[1.5] opacity-70">
          {article.dek}
        </p>
      )}

      <p className="mt-4 font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-35">
        {article.minutes} min read
      </p>

      {/* Collapsed by default so the queue stays scannable; opening one is a
          deliberate act, which is also when the reviewer starts reading. */}
      <details className="group mt-6">
        <summary className="cursor-pointer list-none font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-55 transition-opacity hover:opacity-100">
          <span className="group-open:hidden">+ Read the piece</span>
          <span className="hidden group-open:inline">− Collapse</span>
        </summary>
        <div className="mt-6 border-t border-white/10 pt-6">
          <Markdown source={article.body} />
        </div>
      </details>

      <ReviewDecision articleId={article.$id} />

      <Link
        href={`/dashboard/articles/${article.$id}`}
        className="mt-6 inline-block font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-45 transition-opacity hover:opacity-100"
      >
        Open in the editor →
      </Link>
    </li>
  );
}

function DecidedRow({ article }: { article: ArticleRow }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-white/8 py-3">
      <StatusPill status={article.status} />
      <Link
        href={`/dashboard/articles/${article.$id}`}
        className="font-garamond text-[17px] transition-colors hover:text-[color:var(--cyan)]"
      >
        {article.title}
      </Link>
      <span className="ml-auto font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-35">
        {article.authorName} · {formatDateTime(article.reviewedAt)}
        {article.reviewedBy ? ` · ${article.reviewedBy}` : ""}
      </span>
    </li>
  );
}

export default async function ReviewPage() {
  await requireSuperadmin();

  const [queue, decided] = await Promise.all([listReviewQueue(), listDecided()]);

  return (
    <>
      <header className="mb-12">
        <p className={EYEBROW}>Superadmin</p>
        <h1 className="mt-4 font-pixel text-[26px] leading-[1.15] uppercase sm:text-[38px]">
          Review queue
        </h1>
        <p className="mt-4 max-w-[54ch] font-garamond text-[17px] leading-[1.5] opacity-60">
          {queue.length === 0
            ? "Nothing waiting. Submissions land here the moment a writer sends them."
            : `${queue.length} ${queue.length === 1 ? "piece" : "pieces"} waiting, oldest first.`}
        </p>
      </header>

      {queue.length > 0 && (
        <ul className="flex flex-col gap-6">
          {queue.map((article) => (
            <Submission key={article.$id} article={article} />
          ))}
        </ul>
      )}

      {decided.length > 0 && (
        <section className="mt-20">
          <p className={EYEBROW}>Already ruled on</p>
          <ul className="mt-6">
            {decided.map((article) => (
              <DecidedRow key={article.$id} article={article} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
