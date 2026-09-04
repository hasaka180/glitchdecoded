import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { SUPERADMIN_LABEL } from "@/lib/appwrite/config";
import { createSessionClient } from "@/lib/appwrite/server";
import type { ArticleRow } from "@/lib/articles/types";
import { EDITABLE_STATUSES } from "@/lib/articles/types";

/**
 * The only shape of the reader that crosses into rendering. Appwrite's account
 * object carries password hashes' metadata, phone numbers and provider tokens;
 * none of that has any business reaching a component.
 */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  isSuperadmin: boolean;
};

/**
 * Resolves the signed-in reader, or null.
 *
 * Memoised per render pass, so a layout, a page and three components asking
 * "who is this?" cost one round trip rather than five.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await createSessionClient();
  if (!session) return null;

  try {
    const account = await session.account.get();
    return {
      id: account.$id,
      name: account.name || account.email,
      email: account.email,
      // Labels are writable only by a server SDK holding the API key, so this
      // cannot be self-granted the way a profile field could.
      isSuperadmin: account.labels.includes(SUPERADMIN_LABEL),
    };
  } catch {
    // Expired or revoked session. Treated as signed out; the stale cookie is
    // cleared on the next explicit sign-in or sign-out.
    return null;
  }
});

/** Gate for any route that needs a reader. Sends them to sign in, then back. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }
  return user;
}

/**
 * Gate for the review desk. Signed-in-but-unprivileged readers are returned to
 * their own dashboard rather than the login page — bouncing them to a form they
 * have already completed reads as a bug.
 */
export async function requireSuperadmin(): Promise<SessionUser> {
  const user = await requireUser("/dashboard/review");
  if (!user.isSuperadmin) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Authorization for a single piece, in one place.
 *
 * Ownership is not enough on its own: a piece sitting `in_review` is frozen for
 * its author, otherwise they could rewrite it under the desk after submitting.
 * A superadmin can always edit — that is the point of the desk.
 */
export function canEditArticle(
  user: SessionUser | null,
  article: Pick<ArticleRow, "authorId" | "status">,
): boolean {
  if (!user) return false;
  if (user.isSuperadmin) return true;
  if (article.authorId !== user.id) return false;
  return EDITABLE_STATUSES.includes(article.status);
}

/** Ownership alone — used for delete, which stays with the author at any state. */
export function ownsArticle(
  user: SessionUser | null,
  article: Pick<ArticleRow, "authorId">,
): boolean {
  if (!user) return false;
  return user.isSuperadmin || article.authorId === user.id;
}
