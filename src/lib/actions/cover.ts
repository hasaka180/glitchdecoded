"use server";

import { revalidatePath } from "next/cache";

import { DATABASE_ID, TABLES } from "@/lib/appwrite/config";
import {
  deleteStoredImage,
  imageProblem,
  storeImage,
} from "@/lib/appwrite/images";
import { createAdminClient } from "@/lib/appwrite/server";
import { getArticleById } from "@/lib/articles/queries";
import { canEditArticle, getCurrentUser } from "@/lib/auth/dal";

/**
 * The cover image.
 *
 * Kept apart from the editor's other fields because it is the only one that is
 * a file: it cannot ride along on an autosave, and replacing it has to clean up
 * the bytes the old one left in the bucket.
 */

export type CoverState = {
  error?: string;
  /** The new URL, so the editor can show it without a round trip. */
  url?: string;
};

/** Loads the piece and checks the caller may change it. */
async function loadEditable(articleId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." } as const;

  const article = await getArticleById(articleId);
  if (!article) return { error: "That piece no longer exists." } as const;
  if (!canEditArticle(user, article)) {
    return { error: "That piece isn't open for editing." } as const;
  }
  return { article } as const;
}

export async function uploadCover(
  _prev: CoverState,
  formData: FormData,
): Promise<CoverState> {
  const articleId = String(formData.get("articleId") ?? "");
  const loaded = await loadEditable(articleId);
  if ("error" in loaded) return { error: loaded.error };
  const { article } = loaded;

  const file = formData.get("file");
  const problem = imageProblem(file);
  if (problem) return { error: problem };

  const stored = await storeImage(file as File);

  // The old file goes only once the new one is safely stored, so a failed
  // upload leaves the piece with the cover it already had.
  await deleteStoredImage(article.coverImageId);

  await createAdminClient().tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: {
      coverImageId: stored.id,
      coverImageUrl: stored.url,
      coverSource: "upload",
    },
  });

  revalidatePath(`/dashboard/articles/${article.$id}`);
  return { url: stored.url };
}

export async function removeCover(
  _prev: CoverState,
  formData: FormData,
): Promise<CoverState> {
  const articleId = String(formData.get("articleId") ?? "");
  const loaded = await loadEditable(articleId);
  if ("error" in loaded) return { error: loaded.error };
  const { article } = loaded;

  await deleteStoredImage(article.coverImageId);

  await createAdminClient().tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: {
      coverImageId: null,
      coverImageUrl: null,
      coverSource: null,
      // The alt text described a picture that is no longer there.
      coverAlt: null,
    },
  });

  revalidatePath(`/dashboard/articles/${article.$id}`);
  return {};
}
