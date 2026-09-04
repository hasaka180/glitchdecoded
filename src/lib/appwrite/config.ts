/**
 * Appwrite resource names and public configuration.
 *
 * The ids here are fixed rather than generated so `scripts/setup-appwrite.mjs`
 * can be re-run against an existing project without orphaning anything: every
 * resource is addressed by the same id each time.
 */

/** Reads a required env var, failing loudly at boot rather than at first query. */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in, then restart the dev server.`,
    );
  }
  return value;
}

export const APPWRITE_ENDPOINT = required(
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
);

export const APPWRITE_PROJECT_ID = required(
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
);

export const DATABASE_ID = "glitch";

export const TABLES = {
  articles: "articles",
  revisions: "article_revisions",
  comments: "comments",
  reactions: "reactions",
  views: "article_views",
  companion: "companion_messages",
} as const;

export const BUCKET_ID = "article-images";

/**
 * Appwrite user label that grants review powers. Labels are writable only by a
 * server SDK holding the project API key, so a user cannot grant it to
 * themselves the way they could with a profile field.
 */
export const SUPERADMIN_LABEL = "superadmin";

/** Name of the cookie holding the Appwrite session secret. */
export const SESSION_COOKIE = "glitch_session";
