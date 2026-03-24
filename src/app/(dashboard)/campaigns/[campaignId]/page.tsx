import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleTable } from "@/components/articles/article-table";
import {
  Pencil, Plus, Upload, Globe, RefreshCw, User,
  Calendar, Link2, TrendingUp, ShieldCheck, Search,
} from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  ACTIVE:    { label: "Active",    dot: "bg-emerald-400", bg: "bg-emerald-50",  text: "text-emerald-700" },
  PAUSED:    { label: "En pause",  dot: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-700"   },
  COMPLETED: { label: "Terminée", dot: "bg-slate-400",   bg: "bg-slate-100",   text: "text-slate-600"   },
};

const freqLabels: Record<string, string> = {
  DAILY: "Quotidienne", WEEKLY: "Hebdomadaire", MONTHLY: "Mensuelle",
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
          backlinkChecks:   { orderBy: { checkedAt: "desc" }, take: 1 },
          indexationChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!campaign) notFound();

  const s = statusConfig[campaign.status] || statusConfig.ACTIVE;
  const isAdmin = session.user.role === "ADMIN";

  // Quick stats
  const total       = campaign.articles.length;
  const actifCount  = campaign.articles.filter((a) => a.backlinkChecks?.[0]?.status === "FOUND").length;
  const dofollowCnt = campaign.articles.filter((a) => a.backlinkChecks?.[0]?.isDofollow === true).length;
  const indexedCnt  = campaign.articles.filter((a) => a.indexationChecks?.[0]?.status === "INDEXED").length;
  const budget      = campaign.articles.reduce((sum, a) => sum + ((a as { prix?: number | null }).prix ?? 0), 0);

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{campaign.name}</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>
          <p className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
            <Globe className="h-3.5 w-3.5" />
            {campaign.targetDomain}
          </p>
        </div>
        {isAdmin && (
          <Link href={`/campaigns/${campaign.id}/edit`}>
            <button className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800">
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          </Link>
        )}
      </div>

      {/* ── KPI strip ───────────────────────────────────────── */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
              <Link2 className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-slate-800">{total}</p>
              <p className="text-[11px] font-medium text-slate-400">Backlinks</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-slate-800">{actifCount}</p>
              <p className="text-[11px] font-medium text-slate-400">Actifs</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-slate-800">{dofollowCnt}</p>
              <p className="text-[11px] font-medium text-slate-400">Dofollow</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100">
              <Search className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-slate-800">{indexedCnt}</p>
              <p className="text-[11px] font-medium text-slate-400">Indexés</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────── */}
      <Tabs defaultValue="backlinks">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200">
          <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
            {[
              { value: "backlinks", label: "Backlinks", count: total },
              { value: "info",      label: "Informations" },
              { value: "members",   label: "Membres", count: campaign.members.length },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative h-10 rounded-none border-b-2 border-transparent bg-transparent px-4 text-sm font-medium text-slate-500 shadow-none transition-none data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none"
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 tabular-nums data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-600">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Action buttons aligned with tabs */}
          <div className="flex shrink-0 gap-2 pb-1">
            <Link href={`/campaigns/${campaign.id}/articles/new`}>
              <button className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 active:scale-[0.98]">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </Link>
            <Link href={`/campaigns/${campaign.id}/articles/import`}>
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />
                CSV
              </button>
            </Link>
          </div>
        </div>

        {/* ── Backlinks tab ───────────────────────────────── */}
        <TabsContent value="backlinks" className="mt-5">
          {/* Budget total si articles avec prix */}
          {budget > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-slate-400">Budget total investi :</span>
              <span className="font-mono text-sm font-bold text-slate-700">
                {budget.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
          <ArticleTable
            articles={JSON.parse(JSON.stringify(campaign.articles))}
            campaignId={campaign.id}
            isAdmin={isAdmin}
          />
        </TabsContent>

        {/* ── Informations tab ────────────────────────────── */}
        <TabsContent value="info" className="mt-5">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {campaign.description && (
                <div className="px-6 py-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Description</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{campaign.description}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="px-6 py-5 flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Globe className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Domaine cible</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{campaign.targetDomain}</p>
                  </div>
                </div>
                <div className="px-6 py-5 flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                    <RefreshCw className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fréquence</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {freqLabels[campaign.checkFrequency] || campaign.checkFrequency}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="px-6 py-5 flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <User className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Créé par</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{campaign.createdBy.name}</p>
                  </div>
                </div>
                <div className="px-6 py-5 flex items-start gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <Calendar className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Créé le</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {format(new Date(campaign.createdAt), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Membres tab ─────────────────────────────────── */}
        <TabsContent value="members" className="mt-5">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {campaign.members.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm text-slate-400">Aucun membre assigné à cette campagne.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {campaign.members.map((member) => {
                  const initials = member.user.name
                    ? member.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "?";
                  return (
                    <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{member.user.name}</p>
                        <p className="text-xs text-slate-400">{member.user.email}</p>
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
