import "server-only";

import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import {
  COVER_MAX_BYTES,
  COVER_TYPES,
  STORED_EXTENSION,
  STORED_TYPE,
  publicUrl,
  r2Config,
} from "@/lib/storage/config";
import { ImageTooDenseError, encodeForStorage } from "@/lib/storage/encode";

/**
 * Uploading a picture, in one place.
 *
 * Article covers and the board's notes both take an image, and two copies of
 * the same size-and-type check is how one of them quietly stops matching the
 * bucket it writes to.
 *
 * What arrives and what is stored are not the same file: see
 * `@/lib/storage/encode`. The bucket only ever holds WebP under 100 KB, so the
 * accepted input types below describe what the server will decode, and nothing
 * about what a reader ends up fetching.
 */

export type StoredImage = { id: string; url: string };

/**
 * One client, reused.
 *
 * Unlike the Appwrite client next door, this one carries no per-reader state —
 * it only ever acts as the bucket's own credentials — so sharing it across
 * requests keeps the connection pool warm without leaking anything.
 */
let client: S3Client | null = null;

function r2(): S3Client {
  if (client) return client;
  const { endpoint, accessKeyId, secretAccessKey } = r2Config();
  client = new S3Client({
    // R2 is single-region and rejects a real region name; "auto" is what
    // Cloudflare's own examples sign with.
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

/** Returns a reader-facing reason, or null when the file is fine. */
export function imageProblem(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "Pick an image first.";
  if (!COVER_TYPES.has(file.type)) {
    return "That has to be a JPG, PNG, WebP or AVIF.";
  }
  if (file.size > COVER_MAX_BYTES) {
    return `That's ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${COVER_MAX_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

/**
 * Re-encodes the upload and puts the result in the bucket.
 *
 * Returns a reason instead of throwing when the picture itself is the problem,
 * because that is a sentence for the writer to read, not an incident: a file
 * that decodes to nothing usable, or one too dense to reach 100 KB, is
 * something they fix by choosing another picture.
 */
export async function storeImage(
  file: File,
): Promise<StoredImage | { error: string }> {
  let encoded;
  try {
    encoded = await encodeForStorage(Buffer.from(await file.arrayBuffer()));
  } catch (cause) {
    if (cause instanceof ImageTooDenseError) {
      return {
        error:
          "That picture is too detailed to compress — try a smaller crop, or export it at a lower quality first.",
      };
    }
    // Anything else means the bytes did not decode: an extension that lies
    // about its contents, or a file that was truncated on the way up.
    return { error: "That file didn’t open as an image. Try another one." };
  }

  // A random key rather than the reader's filename: two people uploading
  // cover.jpg must not overwrite each other, and a name chosen by the caller
  // is a name that can contain a path.
  const key = `images/${randomUUID()}.${STORED_EXTENSION}`;

  await r2().send(
    new PutObjectCommand({
      Bucket: r2Config().bucket,
      Key: key,
      Body: encoded.bytes,
      // Without this R2 serves application/octet-stream and the browser
      // downloads the picture instead of drawing it. It describes what was
      // stored, which is WebP whatever the upload's own type said.
      ContentType: STORED_TYPE,
      // The bytes are immutable — a replacement gets a new key — so the CDN
      // and the reader's browser may keep them for good.
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return { id: key, url: publicUrl(key) };
}

/** Removes the bytes, tolerating a file that is already gone. */
export async function deleteStoredImage(key: string | null): Promise<void> {
  if (!key) return;
  try {
    await r2().send(
      new DeleteObjectCommand({ Bucket: r2Config().bucket, Key: key }),
    );
  } catch {
    // Already deleted, or never landed. Either way the row is about to stop
    // pointing at it, and a failure here must not block the replacement.
  }
}
