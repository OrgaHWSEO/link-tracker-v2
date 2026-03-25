import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/articles/article-form";

export default async function EditArticlePage({
  params,
}: {
  params: { campaignId: string; articleId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const article = await prisma.article.findUnique({
    where: { id: params.articleId },
    select: {
      id: true,
      articleUrl: true,
      targetUrl: true,
      anchorText: true,
      manualStatus: true,
      prix: true,
      type: true,
      source: true,
    },
  });

  if (!article) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <ArticleForm
        campaignId={params.campaignId}
        article={article}
      />
    </div>
  );
}
