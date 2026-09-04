import "server-only";

import { ID } from "node-appwrite";

import {
  BUCKET_ID,
  COVER_MAX_BYTES,
  COVER_TYPES,
  fileViewUrl,
} from "@/lib/appwrite/config";
import { createAdminClient } from "@/lib/appwrite/server";

/**
 * Uploading a picture, in one place.
 *
 * Article covers and the board's notes both take an image, and two copies of
 * the same size-and-type check is how one of them quietly stops matching the
 * bucket it writes to.
 */

export type StoredImage = { id: string; url: string };

/** Returns a reader-facing reason, or null when the file is fine. */
export function imageProblem(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "Pick an image first.";
  if (!COVER_TYPES.includes(file.type)) {
    return "That has to be a JPG, PNG, WebP or AVIF.";
  }
  if (file.size > COVER_MAX_BYTES) {
    return `That's ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${COVER_MAX_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

export async function storeImage(file: File): Promise<StoredImage> {
  const uploaded = await createAdminClient().storage.createFile({
    bucketId: BUCKET_ID,
    fileId: ID.unique(),
    file,
  });
  return { id: uploaded.$id, url: fileViewUrl(uploaded.$id) };
}

/** Removes the bytes, tolerating a file that is already gone. */
export async function deleteStoredImage(fileId: string | null): Promise<void> {
  if (!fileId) return;
  try {
    await createAdminClient().storage.deleteFile({
      bucketId: BUCKET_ID,
      fileId,
    });
  } catch {
    // Already deleted, or never landed. Either way the row is about to stop
    // pointing at it, and a failure here must not block the replacement.
  }
}
