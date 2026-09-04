"use server";

import { revalidatePath } from "next/cache";

import { clearThread } from "@/lib/ai/thread";
import { getArticleById } from "@/lib/articles/queries";
import { getCurrentUser, ownsArticle } from "@/lib/auth/dal";

export type CompanionState = { error?: string };

/**
 * Empties one conversation.
 *
 * Reachable by direct POST like any Server Action, so it re-checks ownership
 * rather than trusting the form it was rendered next to.
 */
export async function clearCompanionThread(
  _prev: CompanionState,
  formData: FormData,
): Promise<CompanionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  const raw = String(formData.get("articleId") ?? "");
  const articleId = raw || null;

  if (articleId) {
    const article = await getArticleById(articleId);
    if (!article || !ownsArticle(user, article)) {
      return { error: "That piece no longer exists." };
    }
  }

  await clearThread(user.id, articleId);

  revalidatePath(
    articleId ? `/dashboard/articles/${articleId}` : "/dashboard/companion",
  );
  return {};
}
