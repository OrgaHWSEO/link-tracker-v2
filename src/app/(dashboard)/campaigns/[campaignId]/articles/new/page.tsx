import { ArticleForm } from "@/components/articles/article-form";

export default function NewArticlePage({
  params,
}: {
  params: { campaignId: string };
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <ArticleForm campaignId={params.campaignId} />
    </div>
  );
}
