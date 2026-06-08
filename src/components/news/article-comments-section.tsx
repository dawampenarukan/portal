import { CommentSection } from "@/components/news/comment-section";
import { getArticleComments } from "@/lib/queries";

export async function ArticleCommentsSection({ articleId }: { articleId: string }) {
  const comments = await getArticleComments(articleId);
  return <CommentSection articleId={articleId} comments={comments} />;
}
