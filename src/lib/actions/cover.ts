"use server";

import { revalidatePath } from "next/cache";
import { ID } from "node-appwrite";

import {
  BUCKET_ID,
  COVER_MAX_BYTES,
  COVER_TYPES,
  DATABASE_ID,
  fileViewUrl,
  TABLES,
} from "@/lib/appwrite/config";
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

/** Removes the bytes behind a cover, tolerating one that is already gone. */
async function deleteFile(fileId: string | null) {
  if (!fileId) return;
  try {
    await createAdminClient().storage.deleteFile({
      bucketId: BUCKET_ID,
      fileId,
    });
  } catch {
    // Already deleted, or never made it. Either way the row is about to stop
    // pointing at it, and a failure here must not block the replacement.
  }
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
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pick an image first." };
  }
  if (!COVER_TYPES.includes(file.type)) {
    return { error: "That has to be a JPG, PNG, WebP or AVIF." };
  }
  if (file.size > COVER_MAX_BYTES) {
    return {
      error: `That's ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${COVER_MAX_BYTES / 1024 / 1024} MB.`,
    };
  }

  const storage = createAdminClient().storage;

  const uploaded = await storage.createFile({
    bucketId: BUCKET_ID,
    fileId: ID.unique(),
    file,
  });

  // The old file goes only once the new one is safely stored, so a failed
  // upload leaves the piece with the cover it already had.
  await deleteFile(article.coverImageId);

  const url = fileViewUrl(uploaded.$id);

  await createAdminClient().tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: TABLES.articles,
    rowId: article.$id,
    data: {
      coverImageId: uploaded.$id,
      coverImageUrl: url,
      coverSource: "upload",
    },
  });

  revalidatePath(`/dashboard/articles/${article.$id}`);
  return { url };
}

export async function removeCover(
  _prev: CoverState,
  formData: FormData,
): Promise<CoverState> {
  const articleId = String(formData.get("articleId") ?? "");
  const loaded = await loadEditable(articleId);
  if ("error" in loaded) return { error: loaded.error };
  const { article } = loaded;

  await deleteFile(article.coverImageId);

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
