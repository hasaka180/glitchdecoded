import "server-only";

import { ID, Query, type Models } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

import type { CompanionMessage, CompanionMode } from "./modes";
export { MAX_ASKS } from "./modes";

/**
 * Conversations with the companion, stored per writer per piece.
 *
 * They are kept for the same reason the editor keeps revisions: a thread that
 * evaporates on reload teaches writers not to say anything real in it. Rows are
 * read and written through the admin client and scoped by `userId` on every
 * query — see the note in `lib/appwrite/server.ts`.
 */

export type CompanionRow = Models.Row & {
  userId: string;
  articleId: string;
  role: "user" | "assistant";
  body: string;
  mode: string | null;
};

/**
 * The thread that belongs to no particular piece — the blank-page conversation
 * on `/dashboard/companion`. A sentinel rather than an empty string: Appwrite's
 * equality queries are unhappy matching "", and no Appwrite row id is `desk`.
 */
export const OPEN_THREAD = "desk";

export function threadKey(articleId: string | null | undefined): string {
  return articleId && articleId !== OPEN_THREAD ? articleId : OPEN_THREAD;
}

function db() {
  return createAdminClient().tablesDB;
}

/** How much of a thread the panel shows. Cheap — it never leaves the database. */
export const THREAD_WINDOW = 40;

/**
 * How much is replayed to the model on each turn.
 *
 * Every turn re-sends the ones before it, so an uncapped thread costs more with
 * every message in it. Twelve is enough for the companion to remember what it
 * has already asked, which is all the continuity a conversation this short
 * needs.
 */
export const REPLAY_WINDOW = 12;

/** The write-up reads the whole conversation — it runs once per piece. */
export const COMPOSE_WINDOW = 80;



/**
 * The tail of a thread, oldest first.
 *
 * Queried newest-first and reversed, because the interesting end of a long
 * conversation is the recent one and Appwrite has no "last N ascending".
 */
export async function listThread(
  userId: string,
  articleId: string | null,
  limit = THREAD_WINDOW,
): Promise<CompanionRow[]> {
  const res = await db().listRows<CompanionRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.companion,
    queries: [
      Query.equal("userId", userId),
      Query.equal("articleId", threadKey(articleId)),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ],
  });
  return res.rows.reverse();
}

/**
 * How many turns the writer has spent on this thread.
 *
 * Reads Appwrite's `total` off a one-row page rather than pulling the messages:
 * the count is all the route needs to decide whether to answer.
 */
export async function countAsks(
  userId: string,
  articleId: string | null,
): Promise<number> {
  const res = await db().listRows<CompanionRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.companion,
    queries: [
      Query.equal("userId", userId),
      Query.equal("articleId", threadKey(articleId)),
      Query.equal("role", "user"),
      Query.limit(1),
    ],
  });
  return res.total;
}

/**
 * A per-writer ceiling on how often the model may be called, in one window.
 *
 * Counted out of the stored messages rather than a map in memory: this runs on
 * serverless instances that come and go, and an in-process counter there is a
 * limit in name only. The one hole is that clearing a thread deletes the rows
 * it was counting, which resets the window — acceptable for a guard against a
 * stuck retry loop, and worth knowing before it is relied on as a spend cap.
 */
export const RATE_MAX = 30;
export const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function asksInWindow(userId: string): Promise<number> {
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const res = await db().listRows<CompanionRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.companion,
    queries: [
      Query.equal("userId", userId),
      Query.equal("role", "user"),
      Query.greaterThan("$createdAt", since),
      // Only the total is read; a page of one keeps the response small.
      Query.limit(1),
    ],
  });
  return res.total;
}

export async function appendMessage(input: {
  userId: string;
  articleId: string | null;
  role: "user" | "assistant";
  body: string;
  mode?: CompanionMode | null;
}): Promise<CompanionRow> {
  return db().createRow<CompanionRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.companion,
    rowId: ID.unique(),
    data: {
      userId: input.userId,
      articleId: threadKey(input.articleId),
      role: input.role,
      body: input.body,
      mode: input.mode ?? null,
    },
  });
}

/** Empties one thread. Scoped to the caller's own rows, never a whole table. */
export async function clearThread(
  userId: string,
  articleId: string | null,
): Promise<void> {
  const rows = await listThread(userId, articleId, 200);
  await Promise.all(
    rows.map((row) =>
      db().deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.companion,
        rowId: row.$id,
      }),
    ),
  );
}

/** Only what the panel renders crosses to the browser. */
export function toMessage(row: CompanionRow): CompanionMessage {
  return {
    id: row.$id,
    role: row.role,
    body: row.body,
    createdAt: row.$createdAt,
  };
}
