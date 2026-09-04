"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ID } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import {
  getArticleById,
  listRevisions,
  slugExists,
} from "@/lib/articles/queries";
import { snapshotArticle } from "@/lib/articles/revisions";
import type { ArticleRow, ArticleStatus } from "@/lib/articles/types";
import { EDITABLE_STATUSES, readingMinutes, slugify } from "@/lib/articles/types";
import {
  canEditArticle,
  getCurrentUser,
  ownsArticle,
  requireSuperadmin,
  requireUser,
  type SessionUser,
} from "@/lib/auth/dal";
import { isCategorySlug } from "@/lib/categories";
import { isTopicSlug, MAX_TOPICS } from "@/lib/topics";

export type ArticleState = {
  error?: string;
  /** ISO timestamp of the last successful write, for the editor's save marker. */
  savedAt?: string;
};

const MAX_TITLE = 160;
const MAX_DEK = 400;
const MAX_BODY = 120_000;

function db() {
  return createAdminClient().tablesDB;
}

/**
 * Loads a piece and checks the caller may edit it, in one step.
 *
 * Every mutating action starts here. Server Actions are reachable by direct
 * POST, not only through our own forms, so the check cannot live in the page
 * that renders the button.
 */
async function loadEditable(
  articleId: string,
): Promise<{ user: SessionUser; article: ArticleRow } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  const article = await getArticleById(articleId);
  if (!article) return { error: "That piece no longer exists." };

  if (!canEditArticle(user, article)) {
    // Deliberately the same message whether the piece is someone else's or
    // simply frozen in review — it needn't confirm what exists.
    return { error: "That piece isn't open for editing." };
  }
  return { user, article };
}

/** Appends a numeric suffix until the slug is free across the whole table. */
async function uniqueSlug(title: string, exceptId?: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  for (let n = 2; n < 50; n++) {
    if (!(await slugExists(candidate, exceptId))) return candidate;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Reads and bounds the editor fields shared by create, save and autosave. */
function readFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, MAX_TITLE);
  const dek = String(formData.get("dek") ?? "").trim().slice(0, MAX_DEK);
  const body = String(formData.get("body") ?? "").slice(0, MAX_BODY);
  const category = String(formData.get("category") ?? "");
  const seoTitle = String(formData.get("seoTitle") ?? "").trim().slice(0, 160);
  const seoDescription = String(formData.get("seoDescription") ?? "")
    .trim()
    .slice(0, 300);
  const coverAlt = String(formData.get("coverAlt") ?? "").trim().slice(0, 300);
  // Checkboxes, so the browser sends one entry per ticked topic. Unknown
  // slugs are dropped rather than rejected — the form is not the place to
  // discover that the topic list changed under a draft.
  const topics = formData
    .getAll("topics")
    .filter(isTopicSlug)
    .slice(0, MAX_TOPICS);
  return { title, dek, body, category, seoTitle, seoDescription, coverAlt, topics };
}

/**
 * Snapshots the current content into the revision table.
 *
 * Autosaves pass `throttle`, which skips the snapshot when a recent one exists:
 * snapshotting every pass would bury the useful versions — the ones taken at an
 * explicit save or a pipeline move — under hundreds of near-identical rows.
 */
const AUTOSAVE_REVISION_GAP_MS = 10 * 60 * 1000;

async function snapshot(
  article: ArticleRow,
  user: SessionUser,
  note: string | null,
  throttle = false,
) {
  if (throttle) {
    const [latest] = await listRevisions(article.$id, 1);
    if (
      latest &&
      Date.now() - new Date(latest.$createdAt).getTime() <
        AUTOSAVE_REVISION_GAP_MS
    ) {
      return;
    }
  }

  await snapshotArticle(article, user, note);
}

/** Starts a new empty draft and drops the writer straight into the editor. */
export async function createArticle() {
  const user = await requireUser("/dashboard");

  const row = await db().createRow<ArticleRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: ID.unique(),
    data: {
      title: "Untitled",
      slug: await uniqueSlug("untitled"),
      dek: "",
      body: "",
      category: "unpopular",
      status: "draft" satisfies ArticleStatus,
      authorId: user.id,
      authorName: user.name,
      coverImageId: null,
      coverImageUrl: null,
      coverSource: null,
      coverPrompt: null,
      coverAlt: null,
      topics: [],
      minutes: 1,
      views: 0,
      likes: 0,
      dislikes: 0,
      seoTitle: null,
      seoDescription: null,
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: null,
      publishedAt: null,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/articles/${row.$id}`);
}

/**
 * Explicit save from the editor. Always records a revision, so "Save" is the
 * gesture a writer can rely on to create a restore point.
 */
export async function saveArticle(
  _prev: ArticleState,
  formData: FormData,
): Promise<ArticleState> {
  const articleId = String(formData.get("articleId") ?? "");
  const loaded = await loadEditable(articleId);
  if ("error" in loaded) return { error: loaded.error };
  const { user, article } = loaded;

  const fields = readFields(formData);
  if (!fields.title) return { error: "A piece needs a title." };
  if (!isCategorySlug(fields.category)) {
    return { error: "Pick a perspective." };
  }

  await snapshot(article, user, "Manual save");

  // The slug is only recut while the piece is unpublished. Changing it after
  // publication would break every link already shared.
  const slug =
    article.status === "published" || fields.title === article.title
      ? article.slug
      : await uniqueSlug(fields.title, article.$id);

  await db().updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: {
      ...fields,
      slug,
      seoTitle: fields.seoTitle || null,
      seoDescription: fields.seoDescription || null,
      coverAlt: fields.coverAlt || null,
      topics: fields.topics,
      minutes: readingMinutes(fields.body),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/articles/${article.$id}`);
  return { savedAt: new Date().toISOString() };
}

/**
 * Background save from the editor, called on a timer while the writer types.
 *
 * Takes the same fields as `saveArticle` but never moves the piece through the
 * pipeline and only occasionally snapshots — see `snapshot`.
 */
export async function autosaveArticle(
  _prev: ArticleState,
  formData: FormData,
): Promise<ArticleState> {
  const articleId = String(formData.get("articleId") ?? "");
  const loaded = await loadEditable(articleId);
  if ("error" in loaded) return { error: loaded.error };
  const { user, article } = loaded;

  const fields = readFields(formData);
  // An autosave never rejects the work for being incomplete; it just stores
  // whatever is on screen. Validation belongs to save and submit.
  const category = isCategorySlug(fields.category)
    ? fields.category
    : article.category;

  await snapshot(article, user, "Autosave", true);

  await db().updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: {
      title: fields.title || "Untitled",
      dek: fields.dek,
      body: fields.body,
      category,
      seoTitle: fields.seoTitle || null,
      seoDescription: fields.seoDescription || null,
      coverAlt: fields.coverAlt || null,
      topics: fields.topics,
      minutes: readingMinutes(fields.body),
    },
  });

  return { savedAt: new Date().toISOString() };
}

/**
 * Hands the piece to the desk. From here the writer can no longer edit it.
 *
 * The button lives inside the editor form, so this saves what is on screen
 * before submitting — otherwise a writer who typed a last paragraph and hit
 * Submit would send the version before it.
 */
export async function submitForReview(
  _prev: ArticleState,
  formData: FormData,
): Promise<ArticleState> {
  const articleId = String(formData.get("articleId") ?? "");
  const loaded = await loadEditable(articleId);
  if ("error" in loaded) return { error: loaded.error };
  const { user, article } = loaded;

  const fields = readFields(formData);
  const title = fields.title || article.title;
  const body = fields.body || article.body;
  const category = isCategorySlug(fields.category)
    ? fields.category
    : article.category;

  if (!title.trim() || title === "Untitled") {
    return { error: "Give it a title before submitting." };
  }
  if (body.trim().length < 200) {
    return { error: "There isn't enough here to review yet." };
  }
  if (!isCategorySlug(category)) {
    return { error: "Pick a perspective before submitting." };
  }

  await snapshot(article, user, "Submitted for review");

  const slug =
    article.status === "published" || title === article.title
      ? article.slug
      : await uniqueSlug(title, article.$id);

  await db().updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: {
      title,
      slug,
      dek: fields.dek,
      body,
      category,
      seoTitle: fields.seoTitle || null,
      seoDescription: fields.seoDescription || null,
      coverAlt: fields.coverAlt || null,
      topics: fields.topics,
      minutes: readingMinutes(body),
      status: "in_review" satisfies ArticleStatus,
      submittedAt: new Date().toISOString(),
      // The previous round's note is cleared so the writer isn't looking at
      // feedback they have already acted on.
      reviewNote: null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/review");
  redirect("/dashboard?submitted=1");
}

/** Pulls a piece back out of the queue while the desk hasn't ruled on it. */
export async function withdrawFromReview(
  _prev: ArticleState,
  formData: FormData,
): Promise<ArticleState> {
  const articleId = String(formData.get("articleId") ?? "");
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  const article = await getArticleById(articleId);
  if (!article) return { error: "That piece no longer exists." };
  if (!ownsArticle(user, article)) return { error: "That isn't yours." };
  if (article.status !== "in_review") {
    return { error: "That piece isn't waiting on the desk." };
  }

  await db().updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: { status: "draft" satisfies ArticleStatus, submittedAt: null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/review");
  return {};
}

export async function deleteArticle(
  _prev: ArticleState,
  formData: FormData,
): Promise<ArticleState> {
  const articleId = String(formData.get("articleId") ?? "");
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  const article = await getArticleById(articleId);
  if (!article) return { error: "That piece no longer exists." };
  if (!ownsArticle(user, article)) return { error: "That isn't yours." };

  // Published work is withdrawn by the desk rather than deleted by its author,
  // so links already in circulation don't start 404ing without a decision.
  if (article.status === "published" && !user.isSuperadmin) {
    return { error: "Published pieces are withdrawn by the desk, not deleted." };
  }

  const revisions = await listRevisions(article.$id, 100);
  await Promise.all(
    revisions.map((rev) =>
      db().deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.revisions,
        rowId: rev.$id,
      }),
    ),
  );

  await db().deleteRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/review");
  redirect("/dashboard?deleted=1");
}

export type Decision = "publish" | "request_changes" | "reject";

const DECISION_STATUS: Record<Decision, ArticleStatus> = {
  publish: "published",
  request_changes: "changes_requested",
  reject: "rejected",
};

/** The desk's ruling. Superadmin only — the gate is the first line here. */
export async function decideReview(
  _prev: ArticleState,
  formData: FormData,
): Promise<ArticleState> {
  const reviewer = await requireSuperadmin();

  const articleId = String(formData.get("articleId") ?? "");
  const decision = String(formData.get("decision") ?? "") as Decision;
  const note = String(formData.get("reviewNote") ?? "").trim().slice(0, 2000);

  if (!(decision in DECISION_STATUS)) return { error: "Unknown decision." };

  const article = await getArticleById(articleId);
  if (!article) return { error: "That piece no longer exists." };

  // Sending work back without saying why guarantees a second round trip.
  if (decision !== "publish" && !note) {
    return { error: "Leave a note explaining the decision." };
  }

  const status = DECISION_STATUS[decision];

  await db().updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: {
      status,
      reviewNote: note || null,
      reviewedBy: reviewer.name,
      reviewedAt: new Date().toISOString(),
      // Set once. A re-published piece keeps its original publication date.
      publishedAt:
        status === "published"
          ? (article.publishedAt ?? new Date().toISOString())
          : article.publishedAt,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/review");
  revalidatePath(`/read/${article.slug}`);
  return {};
}

/** Takes a published piece back off the site without deleting it. */
export async function unpublishArticle(
  _prev: ArticleState,
  formData: FormData,
): Promise<ArticleState> {
  await requireSuperadmin();

  const articleId = String(formData.get("articleId") ?? "");
  const article = await getArticleById(articleId);
  if (!article) return { error: "That piece no longer exists." };

  await db().updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: { status: "draft" satisfies ArticleStatus },
  });

  revalidatePath("/dashboard/review");
  revalidatePath(`/read/${article.slug}`);
  return {};
}

/** Puts an earlier snapshot back into the editor as the current content. */
export async function restoreRevision(
  _prev: ArticleState,
  formData: FormData,
): Promise<ArticleState> {
  const articleId = String(formData.get("articleId") ?? "");
  const revisionId = String(formData.get("revisionId") ?? "");

  const loaded = await loadEditable(articleId);
  if ("error" in loaded) return { error: loaded.error };
  const { user, article } = loaded;

  if (!EDITABLE_STATUSES.includes(article.status) && !user.isSuperadmin) {
    return { error: "That piece isn't open for editing." };
  }

  const revisions = await listRevisions(article.$id, 100);
  const revision = revisions.find((r) => r.$id === revisionId);
  if (!revision) return { error: "That version is no longer available." };

  // The state being replaced is itself snapshotted first, so restoring is
  // never the move that loses work.
  await snapshot(article, user, "Before restore");

  await db().updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: {
      title: revision.title,
      dek: revision.dek,
      body: revision.body,
      category: revision.category,
      minutes: readingMinutes(revision.body),
    },
  });

  revalidatePath(`/dashboard/articles/${article.$id}`);
  return { savedAt: new Date().toISOString() };
}
