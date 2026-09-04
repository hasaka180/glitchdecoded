import "server-only";

import { ID, Query, type Models } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

import type { CompanionMessage, CompanionMode } from "./modes";

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

/** How much of a thread is replayed to the model, and shown on the panel. */
export const THREAD_WINDOW = 40;

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
