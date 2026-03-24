import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleTable } from "@/components/articles/article-table";
import { Pencil, Plus, Upload, Globe, RefreshCw, User, Calendar } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  ACTIVE:    { label: "Active",    dot: "bg-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700" },
  PAUSED:    { label: "En pause",  dot: "bg-amber-400",   bg: "bg-amber-50",   text: "text-amber-700" },
  COMPLETED: { label: "Terminée", dot: "bg-gray-400",    bg: "bg-gray-100",   text: "text-gray-600" },
};

const freqLabels: Record<string, string> = {
  DAILY: "Quotidienne",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuelle",
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
          indexationChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!campaign) notFound();

  const s = statusConfig[campaign.status] || statusConfig.ACTIVE;
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{campaign.name}</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-gray-400">
            <Globe className="h-3.5 w-3.5" />
            {campaign.targetDomain}
          </p>
        </div>
        <Link href={`/campaigns/${campaign.id}/edit`}>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="articles">
        <TabsList className="bg-gray-100 p-1 rounded-lg h-auto">
          <TabsTrigger value="articles" className="rounded-md text-sm px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Articles
            <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              {campaign.articles.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-md text-sm px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Informations
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-md text-sm px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Membres
            <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
              {campaign.members.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Articles */}
        <TabsContent value="articles" className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Link href={`/campaigns/${campaign.id}/articles/new`}>
              <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                <Plus className="h-4 w-4" />
                Ajouter un article
              </button>
            </Link>
            <Link href={`/campaigns/${campaign.id}/articles/import`}>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <Upload className="h-4 w-4" />
                Importer CSV
              </button>
            </Link>
          </div>
          <ArticleTable
            articles={JSON.parse(JSON.stringify(campaign.articles))}
            campaignId={campaign.id}
            isAdmin={isAdmin}
          />
        </TabsContent>

        {/* Informations */}
        <TabsContent value="info" className="mt-4">
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="divide-y">
              {campaign.description && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{campaign.description}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
                <div className="px-6 py-4 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Globe className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Domaine cible</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-900">{campaign.targetDomain}</p>
                  </div>
                </div>
                <div className="px-6 py-4 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                    <RefreshCw className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Fréquence</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-900">
                      {freqLabels[campaign.checkFrequency] || campaign.checkFrequency}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
                <div className="px-6 py-4 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                    <User className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Créé par</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-900">{campaign.createdBy.name}</p>
                  </div>
                </div>
                <div className="px-6 py-4 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                    <Calendar className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Créé le</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-900">
                      {format(new Date(campaign.createdAt), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Membres */}
        <TabsContent value="members" className="mt-4">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            {campaign.members.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">Aucun membre assigné à cette campagne.</p>
              </div>
            ) : (
              <div className="divide-y">
                {campaign.members.map((member) => {
                  const initials = member.user.name
                    ? member.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "?";
                  return (
                    <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                        <p className="text-xs text-gray-400">{member.user.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
