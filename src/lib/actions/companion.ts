"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APIError } from "openai";
import { ID } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import { MissingCompanionKey } from "@/lib/ai/client";
import { RanOutOfRoom } from "@/lib/ai/fields";
import {
  composeFromThread,
  EmptyConversation,
  type ComposedDraft,
} from "@/lib/ai/compose";
import type { DraftContext } from "@/lib/ai/companion";
import {
  appendMessage,
  clearThread,
  COMPOSE_WINDOW,
  listThread,
} from "@/lib/ai/thread";
import { getArticleById } from "@/lib/articles/queries";
import { snapshotArticle } from "@/lib/articles/revisions";
import type { ArticleRow, ArticleStatus } from "@/lib/articles/types";
import { readingMinutes, slugify } from "@/lib/articles/types";
import { canEditArticle, getCurrentUser, ownsArticle } from "@/lib/auth/dal";

export type CompanionState = { error?: string };

export type ComposeState = {
  error?: string;
  /** The fields the editor should populate, when a write-up succeeded. */
  draft?: ComposedDraft;
};

/** The model's failure modes, in words a writer can act on. */
function readableError(error: unknown): string {
  console.error("[companion]", error);

  if (error instanceof MissingCompanionKey) return error.message;
  if (error instanceof EmptyConversation) return error.message;
  if (error instanceof RanOutOfRoom) return error.message;
  if (error instanceof APIError) {
    if (error.status === 429) {
      return "The model is rate limited right now. Wait a moment and try again.";
    }
    if (error.status === 401) {
      return "The site's API key was rejected. That's our end, not yours.";
    }
    return `The write-up failed (${error.status ?? "no response"}). Try again.`;
  }
  return "The write-up failed. Try again.";
}

/**
 * Empties one conversation.
 *
 * Reachable by direct POST like any Server Action, so it re-checks ownership
 * rather than trusting the form it was rendered next to.
 */
export async function clearCompanionThread(
  _prev: CompanionState,
  formData: FormData,
): Promise<CompanionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  const raw = String(formData.get("articleId") ?? "");
  const articleId = raw || null;

  if (articleId) {
    const article = await getArticleById(articleId);
    if (!article || !ownsArticle(user, article)) {
      return { error: "That piece no longer exists." };
    }
  }

  await clearThread(user.id, articleId);

  revalidatePath(
    articleId ? `/dashboard/articles/${articleId}` : "/dashboard/companion",
  );
  return {};
}

/**
 * Ends the conversation by writing it up into the editor's fields.
 *
 * Returns the draft rather than writing it to the row: the writer sees it land
 * in the form and can still walk away without saving. What was in the editor
 * before is snapshotted first regardless, so History always has the way back.
 */
export async function composeDraft(
  _prev: ComposeState,
  formData: FormData,
): Promise<ComposeState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  const articleId = String(formData.get("articleId") ?? "");
  const article = await getArticleById(articleId);
  if (!article || !ownsArticle(user, article)) {
    return { error: "That piece no longer exists." };
  }
  if (!canEditArticle(user, article)) {
    return { error: "That piece isn't open for editing." };
  }

  // What is on screen, which is ahead of the row between autosaves.
  const draft: DraftContext = {
    title: String(formData.get("title") ?? "") || article.title,
    dek: String(formData.get("dek") ?? "") || article.dek || "",
    body: String(formData.get("body") ?? "") || article.body || "",
    category: String(formData.get("category") ?? "") || article.category,
    status: article.status,
    reviewNote: article.reviewNote,
    hasCover: Boolean(article.coverImageUrl),
  };

  let composed: ComposedDraft;
  try {
    composed = await composeFromThread({
      writerName: user.name,
      thread: await listThread(user.id, articleId, COMPOSE_WINDOW),
      draft,
    });
  } catch (error) {
    return { error: readableError(error) };
  }

  // Taken after the model has answered, so a failed write-up doesn't litter
  // History with snapshots of a piece that was never touched.
  await snapshotArticle(article, user, "Before write-up");

  // The note goes into the thread rather than a toast: it is the companion
  // telling the writer what it guessed at, and that belongs in the record.
  await appendMessage({
    userId: user.id,
    articleId,
    role: "assistant",
    body: `**Written up into the editor.**\n\n${composed.note}`,
  });

  revalidatePath(`/dashboard/articles/${articleId}`);
  return { draft: composed };
}

/**
 * The same move from the blank-page thread: there is no piece to fill in, so
 * one is created and the writer is dropped into it.
 */
export async function startPieceFromConversation(
  // Both are the `useActionState` contract rather than inputs: everything this
  // needs is the caller's own thread.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: ComposeState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ComposeState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  let composed: ComposedDraft;
  try {
    composed = await composeFromThread({
      writerName: user.name,
      thread: await listThread(user.id, null, COMPOSE_WINDOW),
      draft: null,
    });
  } catch (error) {
    return { error: readableError(error) };
  }

  const db = createAdminClient().tablesDB;

  const row = await db.createRow<ArticleRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: ID.unique(),
    data: {
      title: composed.title,
      // Uniqueness is settled by the editor's own save; a fresh draft only
      // needs a slug that isn't already taken this second.
      slug: `${slugify(composed.title)}-${Date.now().toString(36)}`,
      dek: composed.dek,
      body: composed.body,
      category: composed.category,
      status: "draft" satisfies ArticleStatus,
      authorId: user.id,
      authorName: user.name,
      coverImageId: null,
      coverImageUrl: null,
      coverSource: null,
      coverPrompt: null,
      coverAlt: null,
      topics: composed.topics,
      minutes: readingMinutes(composed.body),
      views: 0,
      likes: 0,
      dislikes: 0,
      seoTitle: composed.seoTitle || null,
      seoDescription: composed.seoDescription || null,
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: null,
      publishedAt: null,
    },
  });

  // The conversation that produced it moves across, so the piece arrives with
  // its own working notes rather than orphaned on the blank-page thread.
  const thread = await listThread(user.id, null, COMPOSE_WINDOW);
  for (const message of thread) {
    await appendMessage({
      userId: user.id,
      articleId: row.$id,
      role: message.role,
      body: message.body,
    });
  }
  await clearThread(user.id, null);

  await appendMessage({
    userId: user.id,
    articleId: row.$id,
    role: "assistant",
    body: `**Written up into a draft.**\n\n${composed.note}`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/companion");
  redirect(`/dashboard/articles/${row.$id}`);
}
