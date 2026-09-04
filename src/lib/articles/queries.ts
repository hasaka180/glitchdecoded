import "server-only";

import { Query } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

import type { ArticleRow, ArticleStatus, RevisionRow } from "./types";

/**
 * Reads run through the admin client and are filtered here rather than by row
 * permissions — see the note in `lib/appwrite/server.ts`. Every function in
 * this file is therefore scoped by an explicit query; none of them return an
 * unfiltered table.
 */
function db() {
  return createAdminClient().tablesDB;
}

/** A creator's own desk, newest activity first. */
export async function listArticlesByAuthor(
  authorId: string,
  status?: ArticleStatus,
): Promise<ArticleRow[]> {
  const queries = [
    Query.equal("authorId", authorId),
    Query.orderDesc("$updatedAt"),
    Query.limit(100),
  ];
  if (status) queries.push(Query.equal("status", status));

  const res = await db().listRows<ArticleRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    queries,
  });
  return res.rows;
}

/**
 * The review desk: everything waiting on a decision, oldest first so the queue
 * drains fairly rather than by whoever submitted most recently.
 */
export async function listReviewQueue(): Promise<ArticleRow[]> {
  const res = await db().listRows<ArticleRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    queries: [
      Query.equal("status", "in_review"),
      Query.orderAsc("submittedAt"),
      Query.limit(100),
    ],
  });
  return res.rows;
}

/** Everything the desk has already ruled on, for an audit trail. */
export async function listDecided(limit = 40): Promise<ArticleRow[]> {
  const res = await db().listRows<ArticleRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    queries: [
      Query.equal("status", ["published", "rejected", "changes_requested"]),
      Query.orderDesc("reviewedAt"),
      Query.limit(limit),
    ],
  });
  return res.rows;
}

export async function getArticleById(id: string): Promise<ArticleRow | null> {
  try {
    return await db().getRow<ArticleRow>({
      databaseId: DATABASE_ID,
      tableId: TABLES.articles,
      rowId: id,
    });
  } catch {
    return null;
  }
}

/** Public lookup. Only ever returns published work, whoever is asking. */
export async function getPublishedBySlug(
  slug: string,
): Promise<ArticleRow | null> {
  const res = await db().listRows<ArticleRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    queries: [
      Query.equal("slug", slug),
      Query.equal("status", "published"),
      Query.limit(1),
    ],
  });
  return res.rows[0] ?? null;
}

/** Used to keep slugs unique across the whole table, not just per author. */
export async function slugExists(
  slug: string,
  exceptId?: string,
): Promise<boolean> {
  const res = await db().listRows<ArticleRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    queries: [Query.equal("slug", slug), Query.limit(2)],
  });
  return res.rows.some((row) => row.$id !== exceptId);
}

export async function listPublished(limit = 24): Promise<ArticleRow[]> {
  const res = await db().listRows<ArticleRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    queries: [
      Query.equal("status", "published"),
      Query.orderDesc("publishedAt"),
      Query.limit(limit),
    ],
  });
  return res.rows;
}

/** Newest first — the editor shows the most recent snapshot at the top. */
export async function listRevisions(
  articleId: string,
  limit = 30,
): Promise<RevisionRow[]> {
  const res = await db().listRows<RevisionRow>({
    databaseId: DATABASE_ID,
    tableId: TABLES.revisions,
    queries: [
      Query.equal("articleId", articleId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ],
  });
  return res.rows;
}

export async function getRevision(id: string): Promise<RevisionRow | null> {
  try {
    return await db().getRow<RevisionRow>({
      databaseId: DATABASE_ID,
      tableId: TABLES.revisions,
      rowId: id,
    });
  } catch {
    return null;
  }
}
