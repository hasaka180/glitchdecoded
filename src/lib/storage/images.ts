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
  publicUrl,
  r2Config,
} from "@/lib/storage/config";

/**
 * Uploading a picture, in one place.
 *
 * Article covers and the board's notes both take an image, and two copies of
 * the same size-and-type check is how one of them quietly stops matching the
 * bucket it writes to.
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
  // `hasOwn` rather than `in`: "toString" is in every plain object, and a
  // File carrying that as its type would otherwise pass and be keyed with a
  // function.
  if (!Object.hasOwn(COVER_TYPES, file.type)) {
    return "That has to be a JPG, PNG, WebP or AVIF.";
  }
  if (file.size > COVER_MAX_BYTES) {
    return `That's ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${COVER_MAX_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

export async function storeImage(file: File): Promise<StoredImage> {
  // A random key rather than the reader's filename: two people uploading
  // cover.jpg must not overwrite each other, and a name chosen by the caller
  // is a name that can contain a path.
  const key = `images/${randomUUID()}.${COVER_TYPES[file.type]}`;

  await r2().send(
    new PutObjectCommand({
      Bucket: r2Config().bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      // Without this R2 serves application/octet-stream and the browser
      // downloads the picture instead of drawing it.
      ContentType: file.type,
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
