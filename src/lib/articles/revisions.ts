import "server-only";

import { ID } from "node-appwrite";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";
import type { ArticleRow } from "@/lib/articles/types";

/**
 * Writes the piece's current content into the revision table.
 *
 * Lives here rather than in an action file so more than one action can take a
 * snapshot: everything in `lib/actions` is a Server Action reachable by direct
 * POST, and a helper exported from there would become one too.
 */
export async function snapshotArticle(
  article: ArticleRow,
  savedBy: { id: string; name: string },
  note: string | null,
): Promise<void> {
  await createAdminClient().tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.revisions,
    rowId: ID.unique(),
    data: {
      articleId: article.$id,
      title: article.title,
      dek: article.dek,
      body: article.body,
      category: article.category,
      savedBy: savedBy.id,
      savedByName: savedBy.name,
      note,
    },
  });
}
