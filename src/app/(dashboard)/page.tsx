import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, FileText, Link, AlertTriangle } from "lucide-react";
import { OverviewStats } from "@/components/dashboard/overview-stats";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [campaignCount, articleCount, recentArticles, confirmedArticles, thisMoisArticles, lastMoisArticles] = await Promise.all([
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.article.count(),
    prisma.article.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { campaign: { select: { name: true } } },
    }),
    prisma.article.count({ where: { manualStatus: "CONFIRMED" } }),
    prisma.article.count({ where: { createdAt: { gte: startOfThisMonth } } }),
    prisma.article.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
  ]);

  const ceMoisGrowth = lastMoisArticles > 0
    ? Math.round(((thisMoisArticles - lastMoisArticles) / lastMoisArticles) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour, {session.user.name}</h1>
        <p className="text-gray-500">Vue d&apos;ensemble de vos campagnes</p>
      </div>

      <OverviewStats
        total={articleCount}
        actifs={confirmedArticles}
        ceMois={thisMoisArticles}
        ceMoisGrowth={ceMoisGrowth}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Campagnes actives
            </CardTitle>
            <Megaphone className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{campaignCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Articles suivis
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{articleCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Backlinks
            </CardTitle>
            <Link className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-400">Sprint 2</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Alertes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-400">Sprint 4</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles recents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentArticles.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun article pour le moment. Commencez par creer une campagne.
            </p>
          ) : (
            <div className="space-y-3">
              {recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {article.articleUrl}
                    </p>
                    <p className="text-xs text-gray-500">
                      {article.campaign.name}
                    </p>
                  </div>
                  <span className="ml-2 shrink-0 text-xs text-gray-400">
                    {article.manualStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
