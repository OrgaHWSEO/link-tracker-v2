import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleTable } from "@/components/articles/article-table";
import { Pencil, Plus, Upload } from "lucide-react";
import { format } from "date-fns";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  PAUSED: { label: "En pause", variant: "secondary" },
  COMPLETED: { label: "Terminee", variant: "outline" },
};

export default async function CampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      createdBy: { select: { name: true } },
      articles: {
        orderBy: { createdAt: "desc" },
        include: {
          backlinkChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!campaign) notFound();

  const status = statusMap[campaign.status] || statusMap.ACTIVE;
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-gray-500">{campaign.targetDomain}</p>
        </div>
        <Link href={`/campaigns/${campaign.id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">
            Articles ({campaign.articles.length})
          </TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="members">
            Membres ({campaign.members.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <div className="flex gap-2">
            <Link href={`/campaigns/${campaign.id}/articles/new`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un article
              </Button>
            </Link>
            <Link href={`/campaigns/${campaign.id}/articles/import`}>
              <Button size="sm" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importer CSV
              </Button>
            </Link>
          </div>
          <ArticleTable
            articles={JSON.parse(JSON.stringify(campaign.articles))}
            campaignId={campaign.id}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1">{campaign.description || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Domaine cible
                  </dt>
                  <dd className="mt-1">{campaign.targetDomain}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Frequence de verification
                  </dt>
                  <dd className="mt-1">{campaign.checkFrequency}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Cree par
                  </dt>
                  <dd className="mt-1">{campaign.createdBy.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Date de creation
                  </dt>
                  <dd className="mt-1">
                    {format(new Date(campaign.createdAt), "dd/MM/yyyy")}
                  </dd>
                </div>
                {campaign.startDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Date de debut
                    </dt>
                    <dd className="mt-1">
                      {format(new Date(campaign.startDate), "dd/MM/yyyy")}
                    </dd>
                  </div>
                )}
                {campaign.endDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Date de fin
                    </dt>
                    <dd className="mt-1">
                      {format(new Date(campaign.endDate), "dd/MM/yyyy")}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Membres de la campagne</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaign.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-sm text-gray-500">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
