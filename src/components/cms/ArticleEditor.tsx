"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";

import CompanionDrawer from "@/components/cms/CompanionDrawer";
import CoverField from "@/components/cms/CoverField";
import Markdown from "@/components/cms/Markdown";
import StatusPill from "@/components/cms/StatusPill";
import SubmitButton from "@/components/cms/SubmitButton";
import {
  BUTTON_DANGER,
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  ERROR_BOX,
  EYEBROW,
  INPUT,
  LABEL,
} from "@/components/cms/ui";
import {
  autosaveArticle,
  deleteArticle,
  restoreRevision,
  saveArticle,
  submitForReview,
  withdrawFromReview,
  type ArticleState,
} from "@/lib/actions/articles";
import { suggestSeoFields } from "@/lib/actions/seo";
import type { ComposedDraft } from "@/lib/ai/compose";
import type { CompanionMessage } from "@/lib/ai/modes";
import type { ArticleStatus } from "@/lib/articles/types";
import { readingMinutes } from "@/lib/articles/types";
import { CATEGORIES } from "@/lib/categories";
import { MAX_TOPICS, TOPICS } from "@/lib/topics";
import { formatDateTime } from "@/lib/format";

/** Only what the editor actually renders crosses from the server. */
export type EditorArticle = {
  id: string;
  title: string;
  slug: string;
  dek: string;
  body: string;
  category: string;
  status: ArticleStatus;
  seoTitle: string;
  seoDescription: string;
  coverImageUrl: string | null;
  coverAlt: string;
  topics: string[];
  reviewNote: string | null;
  reviewedBy: string | null;
  updatedAt: string;
};

export type EditorRevision = {
  id: string;
  title: string;
  note: string | null;
  savedByName: string;
  createdAt: string;
};

/** How long the writer must pause before a background save fires. */
const AUTOSAVE_IDLE_MS = 2500;

export default function ArticleEditor({
  article,
  revisions,
  canEdit,
  isSuperadmin,
  companion,
  companionConfigured,
}: {
  article: EditorArticle;
  revisions: EditorRevision[];
  canEdit: boolean;
  isSuperadmin: boolean;
  /** This piece's conversation with the companion, oldest turn first. */
  companion: CompanionMessage[];
  companionConfigured: boolean;
}) {
  const [title, setTitle] = useState(article.title);
  const [dek, setDek] = useState(article.dek);
  const [body, setBody] = useState(article.body);
  const [category, setCategory] = useState(article.category);
  const [seoTitle, setSeoTitle] = useState(article.seoTitle);
  const [seoDescription, setSeoDescription] = useState(article.seoDescription);
  const [coverAlt, setCoverAlt] = useState(article.coverAlt);
  const [topics, setTopics] = useState<string[]>(article.topics);

  function toggleTopic(slug: string) {
    setTopics((current) =>
      current.includes(slug)
        ? current.filter((t) => t !== slug)
        : current.length >= MAX_TOPICS
          ? current
          : [...current, slug],
    );
  }

  // --- search and social, drafted from the piece ----------------------------
  const [seoPending, setSeoPending] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  /**
   * Called straight from the click rather than through `useActionState`: the
   * result has to land in six controlled fields, and an action hook would mean
   * copying it out of render state in an effect.
   */
  async function draftSeo() {
    setSeoPending(true);
    setSeoError(null);

    const payload = new FormData();
    payload.set("articleId", article.id);
    payload.set("title", title);
    payload.set("dek", dek);
    payload.set("body", body);
    payload.set("category", category);

    try {
      const result = await suggestSeoFields({}, payload);
      if (result.error) setSeoError(result.error);
      if (result.fields) {
        setTopics(result.fields.topics);
        // The written fields are only filled where they are empty. A writer who
        // has already chosen their search title meant it, and this button is
        // reached for to tag the piece as often as to rewrite that.
        if (!seoTitle.trim()) setSeoTitle(result.fields.seoTitle);
        if (!seoDescription.trim()) {
          setSeoDescription(result.fields.seoDescription);
        }
        if (!coverAlt.trim() && result.fields.coverAlt) {
          setCoverAlt(result.fields.coverAlt);
        }
      }
    } catch {
      setSeoError("Couldn't draft those. Try again.");
    } finally {
      setSeoPending(false);
    }
  }

  const [tab, setTab] = useState<"write" | "preview">("write");
  /**
   * Open when there is something to do in there.
   *
   * The section was collapsed by default and the assist that fills it was
   * therefore invisible — a writer who has never expanded it has no way to
   * learn the button exists. Once both fields are written, it folds away
   * again and stops taking up the room.
   */
  const [showSeo, setShowSeo] = useState(
    !article.seoTitle || !article.seoDescription,
  );

  // `isPending` rather than `useFormStatus` for the two rail buttons: they
  // reach the editor form through the `form` attribute, and useFormStatus only
  // sees a form the button sits inside in the React tree.
  const [saveState, saveAction, saving] = useActionState<ArticleState, FormData>(
    saveArticle,
    {},
  );
  const [submitState, submitAction, submitting] = useActionState<
    ArticleState,
    FormData
  >(submitForReview, {});
  const [withdrawState, withdrawAction] = useActionState<ArticleState, FormData>(
    withdrawFromReview,
    {},
  );
  const [deleteState, deleteAction] = useActionState<ArticleState, FormData>(
    deleteArticle,
    {},
  );
  const [restoreState, restoreAction] = useActionState<ArticleState, FormData>(
    restoreRevision,
    {},
  );

  // --- autosave ------------------------------------------------------------
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  /** The last content the server is known to hold, so an idle tab stays quiet. */
  const lastSaved = useRef(
    JSON.stringify([article.title, article.dek, article.body, article.category]),
  );

  useEffect(() => {
    if (!canEdit) return;

    const current = JSON.stringify([title, dek, body, category]);
    if (current === lastSaved.current) return;

    const timer = setTimeout(async () => {
      const form = new FormData();
      form.set("articleId", article.id);
      form.set("title", title);
      form.set("dek", dek);
      form.set("body", body);
      form.set("category", category);
      form.set("seoTitle", seoTitle);
      form.set("seoDescription", seoDescription);
      form.set("coverAlt", coverAlt);
      for (const topic of topics) form.append("topics", topic);

      setAutosaving(true);
      try {
        const result = await autosaveArticle({}, form);
        if (result.savedAt) {
          lastSaved.current = current;
          setAutosavedAt(result.savedAt);
        }
      } catch {
        // A failed autosave is not worth interrupting the writing for — the
        // marker simply stops advancing, and Save still reports properly.
      } finally {
        setAutosaving(false);
      }
    }, AUTOSAVE_IDLE_MS);

    return () => clearTimeout(timer);
  }, [
    title,
    dek,
    body,
    category,
    seoTitle,
    seoDescription,
    coverAlt,
    topics,
    article.id,
    canEdit,
  ]);

  // Warn before losing work that never reached the server.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const current = JSON.stringify([title, dek, body, category]);
      if (canEdit && current !== lastSaved.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [title, dek, body, category, canEdit]);

  useEffect(() => {
    if (saveState.savedAt) {
      lastSaved.current = JSON.stringify([title, dek, body, category]);
    }
    // Only when a save lands; the field values are read, not watched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState.savedAt]);

  // A restore rewrites the row on the server, but the fields above are local
  // state — revalidating the route would leave the writer looking at the text
  // they just replaced. A reload is the only thing that re-seeds them.
  useEffect(() => {
    if (!restoreState.savedAt) return;
    lastSaved.current = JSON.stringify([title, dek, body, category]);
    window.location.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreState.savedAt]);

  const savedAt = saveState.savedAt ?? autosavedAt;
  const error =
    saveState.error ??
    submitState.error ??
    withdrawState.error ??
    deleteState.error ??
    restoreState.error;

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  // The companion reads the draft at the moment a message is sent, so it sees
  // the paragraph just typed rather than the last autosave. Kept in a ref so
  // the callback handed to the panel stays stable while the writer types.
  const draftRef = useRef({ title, dek, body, category });
  useEffect(() => {
    draftRef.current = { title, dek, body, category };
  }, [title, dek, body, category]);
  const getDraft = useCallback(() => draftRef.current, []);

  /**
   * Drops a written-up draft into the form.
   *
   * State rather than a save: the writer sees it arrive in the fields they
   * were already looking at, autosave carries it to the server a beat later,
   * and the version it replaced is in History either way.
   */
  const applyComposed = useCallback((composed: ComposedDraft) => {
    setTitle(composed.title);
    setDek(composed.dek);
    setBody(composed.body);
    setCategory(composed.category);
    setTab("write");
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
      {/* --- the piece ---------------------------------------------------- */}
      <form id="editor" action={saveAction} className="min-w-0">
        <input type="hidden" name="articleId" value={article.id} />

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            className="font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-50 transition-opacity hover:opacity-100"
          >
            ← My pieces
          </Link>
          <StatusPill status={article.status} />

          {/* The piece's one outward move, at the top of the piece. It used to
              sit in the rail, which on a narrow window is a scroll away from
              the thing it acts on. */}
          {canEdit && (
            <button
              type="submit"
              formAction={submitAction}
              disabled={saving || submitting}
              onClick={(event) => {
                if (
                  !window.confirm(
                    "Send this to the desk? You won't be able to edit it while it's in review.",
                  )
                ) {
                  event.preventDefault();
                }
              }}
              className={`${BUTTON_PRIMARY} ml-auto !px-5 !py-2.5 !text-[10px]`}
            >
              {submitting ? "Sending…" : "Submit for review"}
            </button>
          )}
        </div>

        {!canEdit && (
          <p className="pixel-corner-sm mb-8 bg-white/[0.06] px-5 py-4 font-garamond text-[16px] opacity-80">
            {article.status === "in_review"
              ? "This is with the desk. Withdraw it to keep editing."
              : "Published pieces are edited by the desk."}
          </p>
        )}

        {article.reviewNote && (
          <div className="pixel-corner-sm mb-8 border-l-2 border-[color:var(--red)] bg-[color:var(--red-deep)]/15 px-5 py-4">
            <p className="font-arial text-[9px] font-bold tracking-[0.16em] uppercase opacity-60">
              From the desk{article.reviewedBy ? ` · ${article.reviewedBy}` : ""}
            </p>
            <p className="mt-2 font-garamond text-[17px] leading-[1.5]">
              {article.reviewNote}
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className={LABEL} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            maxLength={160}
            required
            className={`${INPUT} font-display text-[24px] sm:text-[28px]`}
            placeholder="The loneliness that doesn't look like loneliness"
          />
        </div>

        <div className="mb-6">
          <label className={LABEL} htmlFor="dek">
            Standfirst
          </label>
          <textarea
            id="dek"
            name="dek"
            value={dek}
            onChange={(e) => setDek(e.target.value)}
            disabled={!canEdit}
            maxLength={400}
            rows={2}
            className={`${INPUT} resize-y`}
            placeholder="One or two lines that make the case for reading on."
          />
          <p className="mt-2 font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
            {dek.length}/400 · shown under the title on the card and the page
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <span className={LABEL} style={{ marginBottom: 0 }}>
            Body
          </span>
          <div className="flex items-center gap-1">
            {(["write", "preview"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTab(mode)}
                className={`px-3 py-1.5 font-arial text-[9px] font-bold tracking-[0.16em] uppercase transition-colors ${
                  tab === mode
                    ? "bg-white/15 text-[color:var(--bone)]"
                    : "opacity-45 hover:opacity-80"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* The textarea stays mounted while previewing: unmounting it would
            drop the caret position and the undo stack. */}
        <div className={tab === "write" ? "" : "hidden"}>
          <textarea
            id="body"
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!canEdit}
            rows={26}
            className={`${INPUT} resize-y font-mono text-[14px] leading-[1.7]`}
            placeholder={"Markdown.\n\n## A heading\n\nA paragraph, with **bold**, *italic* and [links](https://example.com).\n\n> A pull quote.\n\n- A list\n- of things"}
          />
          <p className="mt-2 font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
            {words} words · about {readingMinutes(body)} min · markdown
          </p>
        </div>

        {tab === "preview" && (
          <div className="pixel-corner bg-white/[0.03] px-6 py-8 sm:px-10">
            {body.trim() ? (
              <Markdown source={body} />
            ) : (
              <p className="font-garamond text-[17px] opacity-40">
                Nothing to preview yet.
              </p>
            )}
          </div>
        )}

        <div className="mt-10">
          <span className={LABEL}>Topics</span>
          <p className="mb-4 max-w-[60ch] font-garamond text-[16px] opacity-55">
            What the piece is about, across the perspectives. Each one is a page
            readers can arrive on. Up to {MAX_TOPICS}.
          </p>

          {/* The form posts one entry per topic, which is what the action reads
              back with getAll — the chips below are buttons, not inputs. */}
          {topics.map((slug) => (
            <input key={slug} type="hidden" name="topics" value={slug} />
          ))}

          <ul className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => {
              const on = topics.includes(topic.slug);
              const full = topics.length >= MAX_TOPICS && !on;
              return (
                <li key={topic.slug}>
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={!canEdit || full}
                    onClick={() => toggleTopic(topic.slug)}
                    className="pixel-corner-sm px-3 py-2 font-arial text-[9px] font-bold tracking-[0.14em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-25"
                    style={
                      on
                        ? { backgroundColor: topic.hue, color: "var(--ink)" }
                        : { backgroundColor: "rgba(255,255,255,0.07)" }
                    }
                  >
                    {topic.name}
                  </button>
                </li>
              );
            })}
          </ul>

          {canEdit && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => void draftSeo()}
                disabled={seoPending}
                className={`${BUTTON_GHOST} !px-5 !py-2.5 !text-[10px]`}
              >
                {seoPending ? "Reading the piece…" : "Tag it from the piece"}
              </button>
              <p className="mt-2 max-w-[52ch] font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
                Picks the topics, and fills the search title, description and
                image description where you&rsquo;ve left them empty
              </p>
            </div>
          )}

          {seoError && (
            <p className={`${ERROR_BOX} mt-4`} role="alert">
              {seoError}
            </p>
          )}
        </div>

        <CoverField
          articleId={article.id}
          initialUrl={article.coverImageUrl}
          alt={coverAlt}
          onAltChange={setCoverAlt}
          canEdit={canEdit}
        />

        <button
          type="button"
          onClick={() => setShowSeo((v) => !v)}
          className="mt-10 font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-50 transition-opacity hover:opacity-100"
        >
          {showSeo ? "− " : "+ "}Search &amp; social
        </button>

        {showSeo && (
          <div className="mt-6 flex flex-col gap-6">
            <p className="max-w-[60ch] font-garamond text-[16px] opacity-55">
              How the piece reads on Google and when the link is shared. Leave
              these empty and the title and standfirst are used.
            </p>

            <div>
              <label className={LABEL} htmlFor="seoTitle">
                Search title
              </label>
              <input
                id="seoTitle"
                name="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                disabled={!canEdit}
                maxLength={160}
                className={INPUT}
                placeholder={title || "Defaults to the title"}
              />
              <p className="mt-2 font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
                {(seoTitle || title).length}/60 before Google truncates
              </p>
            </div>
            <div>
              <label className={LABEL} htmlFor="seoDescription">
                Search description
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                disabled={!canEdit}
                maxLength={300}
                rows={3}
                className={`${INPUT} resize-y`}
                placeholder={dek || "Defaults to the standfirst"}
              />
              <p className="mt-2 font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
                {(seoDescription || dek).length}/155 before Google truncates
              </p>
            </div>
          </div>
        )}
      </form>

      {/* --- the rail ----------------------------------------------------- */}
      <aside className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
        {error && (
          <p className={ERROR_BOX} role="alert">
            {error}
          </p>
        )}

        <div>
          <p className={EYEBROW}>The room</p>
          <p className="mt-3 mb-4 font-garamond text-[15px] leading-[1.45] opacity-45">
            A companion that reads what you have so far and asks about it.
            It won&rsquo;t write the piece for you.
          </p>
          <CompanionDrawer
            articleId={article.id}
            initial={companion}
            configured={companionConfigured}
            getDraft={getDraft}
            onCompose={applyComposed}
          />
        </div>

        <div>
          <p className={EYEBROW}>Perspective</p>
          <select
            name="category"
            form="editor"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!canEdit}
            className={`${INPUT} mt-3 appearance-none`}
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug} className="bg-[color:var(--ink)]">
                {c.name}
              </option>
            ))}
          </select>
          <p className="mt-3 font-garamond text-[15px] leading-[1.45] opacity-45">
            {CATEGORIES.find((c) => c.slug === category)?.blurb}
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              form="editor"
              disabled={saving || submitting}
              className={BUTTON_GHOST}
            >
              {saving ? "Saving…" : "Save draft"}
            </button>

            <p className="font-arial text-[9px] tracking-[0.16em] uppercase opacity-35">
              {autosaving || saving
                ? "Saving…"
                : savedAt
                  ? `Saved ${formatDateTime(savedAt)}`
                  : `Last edited ${formatDateTime(article.updatedAt)}`}
            </p>
          </div>
        )}

        {article.status === "in_review" && (
          <form action={withdrawAction}>
            <input type="hidden" name="articleId" value={article.id} />
            <SubmitButton className={BUTTON_GHOST} pendingLabel="Withdrawing…">
              Withdraw from review
            </SubmitButton>
          </form>
        )}

        {article.status === "published" && (
          <Link
            href={`/read/${article.slug}`}
            className="font-arial text-[10px] font-bold tracking-[0.18em] uppercase opacity-60 transition-opacity hover:opacity-100"
          >
            View it live →
          </Link>
        )}

        {revisions.length > 0 && (
          <div>
            <p className={EYEBROW}>History</p>
            <ul className="mt-4 flex flex-col gap-3">
              {revisions.map((rev) => (
                <li
                  key={rev.id}
                  className="flex items-start justify-between gap-3 border-b border-white/8 pb-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-garamond text-[15px] opacity-75">
                      {rev.title || "Untitled"}
                    </p>
                    <p className="mt-1 font-arial text-[9px] tracking-[0.14em] uppercase opacity-35">
                      {formatDateTime(rev.createdAt)}
                      {rev.note ? ` · ${rev.note}` : ""}
                    </p>
                  </div>
                  {canEdit && (
                    <form action={restoreAction} className="shrink-0">
                      <input type="hidden" name="articleId" value={article.id} />
                      <input type="hidden" name="revisionId" value={rev.id} />
                      <SubmitButton
                        className="font-arial text-[9px] font-bold tracking-[0.14em] uppercase opacity-50 transition-opacity hover:opacity-100"
                        pendingLabel="…"
                        confirm="Replace what's in the editor with this version? The current text is saved to history first."
                      >
                        Restore
                      </SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 font-garamond text-[14px] opacity-35">
              Restoring reloads the editor. The text it replaces is saved to
              history first, so nothing is lost.
            </p>
          </div>
        )}

        {(article.status !== "published" || isSuperadmin) && (
          <form action={deleteAction} className="mt-2">
            <input type="hidden" name="articleId" value={article.id} />
            <SubmitButton
              className={BUTTON_DANGER}
              pendingLabel="Deleting…"
              confirm="Delete this piece and its history? This can't be undone."
            >
              Delete
            </SubmitButton>
          </form>
        )}
      </aside>
    </div>
  );
}
