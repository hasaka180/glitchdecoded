import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ArticleEditor, {
  type EditorArticle,
  type EditorRevision,
} from "@/components/cms/ArticleEditor";
import { getArticleById, listRevisions } from "@/lib/articles/queries";
import { canEditArticle, ownsArticle, requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Editing — The desk",
  robots: { index: false, follow: false },
};

export default async function EditArticlePage({
  params,
}: PageProps<"/dashboard/articles/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/articles/${id}`);

  const article = await getArticleById(id);

  // A piece belonging to someone else is a 404, not a 403: a distinct "you
  // can't see this" would confirm which ids exist.
  if (!article || !ownsArticle(user, article)) notFound();

  const revisions = await listRevisions(article.$id, 20);

  // Only the fields the editor renders cross the boundary — the row also
  // carries view counts, reviewer ids and reaction totals it has no use for.
  const editable: EditorArticle = {
    id: article.$id,
    title: article.title,
    slug: article.slug,
    dek: article.dek ?? "",
    body: article.body ?? "",
    category: article.category,
    status: article.status,
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
    reviewNote: article.reviewNote,
    reviewedBy: article.reviewedBy,
    updatedAt: article.$updatedAt,
  };

  const history: EditorRevision[] = revisions.map((rev) => ({
    id: rev.$id,
    title: rev.title,
    note: rev.note,
    savedByName: rev.savedByName,
    createdAt: rev.$createdAt,
  }));

  return (
    <ArticleEditor
      article={editable}
      revisions={history}
      canEdit={canEditArticle(user, article)}
      isSuperadmin={user.isSuperadmin}
    />
  );
}
