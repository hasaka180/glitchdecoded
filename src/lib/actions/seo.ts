"use server";

import { APIError } from "openai";

import { MissingCompanionKey } from "@/lib/ai/client";
import { RanOutOfRoom } from "@/lib/ai/fields";
import { NothingToDescribe, suggestSeo, type SeoSuggestion } from "@/lib/ai/seo";
import { getArticleById } from "@/lib/articles/queries";
import { canEditArticle, getCurrentUser } from "@/lib/auth/dal";

export type SeoState = {
  error?: string;
  /** Suggestions for the editor to fill in; never written to the row here. */
  fields?: SeoSuggestion;
};

/**
 * Reads the piece and says what it is about.
 *
 * Returns rather than saves, like the write-up does: these are suggestions,
 * and the writer's own line always beats a generated one where they have
 * bothered to write it.
 */
export async function suggestSeoFields(
  _prev: SeoState,
  formData: FormData,
): Promise<SeoState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  const articleId = String(formData.get("articleId") ?? "");
  const article = await getArticleById(articleId);
  if (!article) return { error: "That piece no longer exists." };
  if (!canEditArticle(user, article)) {
    return { error: "That piece isn't open for editing." };
  }

  try {
    const fields = await suggestSeo({
      // What is on screen, which is ahead of the row between autosaves.
      title: String(formData.get("title") ?? "") || article.title,
      dek: String(formData.get("dek") ?? "") || article.dek || "",
      body: String(formData.get("body") ?? "") || article.body || "",
      category: String(formData.get("category") ?? "") || article.category,
      hasCover: Boolean(article.coverImageUrl),
    });
    return { fields };
  } catch (error) {
    console.error("[seo]", error);
    if (error instanceof MissingCompanionKey) return { error: error.message };
    if (error instanceof NothingToDescribe) return { error: error.message };
    if (error instanceof RanOutOfRoom) return { error: error.message };
    if (error instanceof APIError) {
      return { error: `Couldn't draft those (${error.status ?? "no response"}).` };
    }
    return { error: "Couldn't draft those. Try again." };
  }
}
