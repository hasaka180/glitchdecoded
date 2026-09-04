import type { Metadata } from "next";
import Link from "next/link";

import StatusPill from "@/components/cms/StatusPill";
import SubmitButton from "@/components/cms/SubmitButton";
import { BUTTON_PRIMARY, EYEBROW } from "@/components/cms/ui";
import { createArticle } from "@/lib/actions/articles";
import { listArticlesByAuthor } from "@/lib/articles/queries";
import type { ArticleRow } from "@/lib/articles/types";
import { requireUser } from "@/lib/auth/dal";
import { categoryHue, categoryName } from "@/lib/categories";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "My pieces — The desk",
  robots: { index: false, follow: false },
};

/** Confirmation of whatever the previous screen just did. */
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="pixel-corner-sm mb-10 bg-[color:var(--cyan)]/15 px-5 py-4 font-garamond text-[17px] ring-1 ring-[color:var(--cyan)]/40">
      {children}
    </p>
  );
}

function Row({ article }: { article: ArticleRow }) {
  const hue = categoryHue(article.category);
  const needsAttention =
    article.status === "changes_requested" || article.status === "rejected";

  return (
    <li>
      <Link
        href={`/dashboard/articles/${article.$id}`}
        className="pixel-corner group relative block bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.07] sm:p-6"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ backgroundColor: hue }}
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            className="font-pixel text-[12px] tracking-[0.02em] uppercase"
            style={{ color: hue }}
          >
            {categoryName(article.category)}
          </span>
          <StatusPill status={article.status} />
          <span className="ml-auto font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-40">
            Edited {formatDateTime(article.$updatedAt)}
          </span>
        </div>

        <h3 className="mt-3 font-garamond text-[22px] leading-[1.2] font-semibold sm:text-[25px]">
          {article.title || "Untitled"}
        </h3>

        {article.dek && (
          <p className="mt-2 max-w-[70ch] font-garamond text-[16px] leading-[1.5] opacity-60">
            {article.dek}
          </p>
        )}

        {/* The desk's note is the reason this piece is back on the writer's
            plate, so it outranks everything else on the row. */}
        {needsAttention && article.reviewNote && (
          <p className="mt-4 border-l-2 border-[color:var(--red)] pl-4 font-garamond text-[16px] leading-[1.5] opacity-85">
            <span className="font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-60">
              From the desk
              {article.reviewedBy ? ` · ${article.reviewedBy}` : ""}
            </span>
            <br />
            {article.reviewNote}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4 font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-40">
          <span>{article.minutes} min</span>
          {article.status === "published" && <span>{article.views} views</span>}
        </div>
      </Link>
    </li>
  );
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  const [articles, params] = await Promise.all([
    listArticlesByAuthor(user.id),
    searchParams,
  ]);

  // Work still on the writer's plate comes first; the rest falls back to the
  // recency order the query already applied.
  const attention = articles.filter(
    (a) => a.status === "changes_requested" || a.status === "rejected",
  );
  const rest = articles.filter((a) => !attention.includes(a));

  return (
    <>
      {params.submitted && (
        <Notice>Sent to the desk. You&rsquo;ll see a note here when it&rsquo;s read.</Notice>
      )}
      {params.deleted && <Notice>Deleted.</Notice>}

      <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={EYEBROW}>Your work</p>
          <h1 className="mt-4 font-pixel text-[26px] leading-[1.15] uppercase sm:text-[38px]">
            My pieces
          </h1>
        </div>

        <form action={createArticle}>
          <SubmitButton className={BUTTON_PRIMARY} pendingLabel="Opening…">
            Start a new piece
          </SubmitButton>
        </form>
      </header>

      {articles.length === 0 ? (
        <div className="pixel-corner bg-white/[0.03] px-6 py-16 text-center">
          <p className="font-garamond text-[19px] opacity-70">
            Nothing here yet.
          </p>
          <p className="mx-auto mt-3 max-w-[42ch] font-garamond text-[16px] opacity-45">
            Start a piece and it stays a private draft until you hand it to the
            desk.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {[...attention, ...rest].map((article) => (
            <Row key={article.$id} article={article} />
          ))}
        </ul>
      )}
    </>
  );
}
