/**
 * Cloudflare R2 — where uploaded pictures live.
 *
 * R2 speaks the S3 API, so the bytes move through `@aws-sdk/client-s3` rather
 * than the Appwrite SDK. Two things follow from that and are worth stating
 * here, because neither is obvious at the call site:
 *
 *  - R2 enforces nothing. The Appwrite bucket had its own size cap and
 *    extension allowlist, so `imageProblem` was a courtesy that produced a
 *    nicer message than the server's. On R2 it is the only check there is.
 *  - Reads do not go through this SDK at all. The bucket is served by a public
 *    custom domain, and what a page needs is a src — so the URL is built from
 *    the key rather than fetched.
 */

/** Reads a required env var, naming the file it belongs in. */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in, then restart the dev server.`,
    );
  }
  return value;
}

/**
 * The connection, read on use rather than at import.
 *
 * Eager reads would mean a project without R2 configured fails to boot even on
 * the pages that never touch an image, which is how a missing key in one
 * environment turns into a blank site rather than a broken upload button.
 */
export function r2Config() {
  const accountId = required("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID);
  return {
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    bucket: required("R2_BUCKET", process.env.R2_BUCKET),
    accessKeyId: required("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: required(
      "R2_SECRET_ACCESS_KEY",
      process.env.R2_SECRET_ACCESS_KEY,
    ),
  };
}

/** What a cover may weigh and be. Nothing downstream re-checks this. */
export const COVER_MAX_BYTES = 8 * 1024 * 1024;

/** Accepted types, paired with the extension the stored key gets. */
export const COVER_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * The public URL of a stored object.
 *
 * This is the bucket's custom domain, not the S3 endpoint: the S3 endpoint
 * answers signed requests only, so a URL built from it would 401 for exactly
 * the signed-out reader a cover image exists for.
 */
export function publicUrl(key: string): string {
  const base = required("R2_PUBLIC_URL", process.env.R2_PUBLIC_URL);
  return `${base.replace(/\/+$/, "")}/${key}`;
}
