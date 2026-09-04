import { notFound } from "next/navigation";

import ArticleBody from "@/components/ArticleBody";
import ArticleModal from "@/components/ArticleModal";
import { getArticleView } from "@/lib/article-view";

/**
 * The intercepted piece. Reached by clicking a card in a listing; the URL
 * becomes `/read/<slug>` and stays shareable, while the listing remains
 * mounted behind the overlay.
 */
export default async function ArticleModalPage(
  props: PageProps<"/read/[slug]">,
) {
  const { slug } = await props.params;
  const article = await getArticleView(slug);
  if (!article) notFound();

  return (
    <ArticleModal hue={article.hue}>
      <ArticleBody article={article} />
    </ArticleModal>
  );
}
