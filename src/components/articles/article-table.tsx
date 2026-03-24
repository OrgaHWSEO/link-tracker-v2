"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { Trash2, ExternalLink, Link2Off, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  articleUrl: string;
  targetUrl: string;
  anchorText: string | null;
  manualStatus: string;
  prix: number | null;
  type: string;
  source: string | null;
  backlinkChecks?: { status: string; isDofollow: boolean | null }[];
  indexationChecks?: { status: string }[];
}

interface ArticleTableProps {
  articles: Article[];
  campaignId: string;
  isAdmin: boolean;
}

function getHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

function ArticleLink({ url }: { url: string }) {
  const display = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      className="group inline-flex items-center gap-1.5 max-w-[220px]"
    >
      <span className="truncate font-mono text-[11px] text-slate-600 group-hover:text-indigo-600 transition-colors">
        {display}
      </span>
      <ExternalLink className="h-2.5 w-2.5 shrink-0 text-slate-300 group-hover:text-indigo-400 transition-colors" />
    </a>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    ARTICLE:    { label: "Article",    cls: "bg-sky-50 text-sky-700 ring-sky-200" },
    FORUM:      { label: "Forum",      cls: "bg-violet-50 text-violet-700 ring-violet-200" },
    COMMUNIQUE: { label: "Comm.",      cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  };
  const c = cfg[type] || cfg.ARTICLE;
  return (
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset", c.cls)}>
      {c.label}
    </span>
  );
}

function ActiveBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-200 text-xs select-none">·</span>;
  const active = status === "FOUND";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
      active ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
             : "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200"
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-400" : "bg-red-400")} />
      {active ? "Actif" : "Inactif"}
    </span>
  );
}

function DofollowBadge({ isDofollow }: { isDofollow?: boolean | null }) {
  if (isDofollow === null || isDofollow === undefined) {
    return <span className="text-slate-200 text-xs select-none">·</span>;
  }
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
      isDofollow
        ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
        : "bg-slate-50 text-slate-500 ring-slate-200"
    )}>
      {isDofollow ? "Dofollow" : "Nofollow"}
    </span>
  );
}

function IndexedBadge({ status }: { status?: string }) {
  if (!status || status === "UNKNOWN") return <span className="text-slate-200 text-xs select-none">·</span>;
  const indexed = status === "INDEXED";
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
      indexed
        ? "bg-teal-50 text-teal-700 ring-teal-200"
        : "bg-slate-50 text-slate-500 ring-slate-200"
    )}>
      {indexed ? "Indexé" : "Non indexé"}
    </span>
  );
}

const COL = "px-3 py-3";
const TH  = "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400";

export function ArticleTable({ articles, campaignId, isAdmin }: ArticleTableProps) {
  const router = useRouter();

  async function handleStatusChange(articleId: string, newStatus: string) {
    const res = await fetch(`/api/campaigns/${campaignId}/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manualStatus: newStatus }),
    });
    if (res.ok) { toast.success("Statut mis à jour"); router.refresh(); }
    else toast.error("Erreur lors de la mise à jour");
  }

  async function handleDelete(articleId: string) {
    if (!confirm("Supprimer ce backlink ?")) return;
    const res = await fetch(`/api/campaigns/${campaignId}/articles/${articleId}`, {
      method: "DELETE",
    });
    if (res.ok) { toast.success("Backlink supprimé"); router.refresh(); }
    else toast.error("Erreur lors de la suppression");
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Link2Off className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Aucun backlink enregistré</p>
        <p className="mt-1 text-sm text-slate-400">Ajoutez des backlinks manuellement ou importez un fichier CSV.</p>
      </div>
    );
  }

  const grouped = articles.reduce<Record<string, Article[]>>((acc, a) => {
    const d = getHostname(a.articleUrl);
    (acc[d] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([domain, rows]) => (
        <div key={domain} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* ── Domain header ─────────────────────────────── */}
          <div className="flex items-center gap-2.5 bg-slate-800 px-4 py-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-700">
              <Globe className="h-3 w-3 text-slate-300" />
            </div>
            <span className="font-mono text-xs font-semibold text-slate-100">{domain}</span>
            <span className="ml-auto rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-300">
              {rows.length}
            </span>
          </div>

          {/* ── Table ──────────────────────────────────────── */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className={TH}>URL</th>
                <th className={TH}>Source</th>
                <th className={TH}>Type</th>
                <th className={TH}>Prix</th>
                <th className={TH}>Ancre</th>
                <th className={TH}>Statut</th>
                <th className={TH}>Lien</th>
                <th className={TH}>Index</th>
                <th className={TH}>Suivi</th>
                {isAdmin && <th className={TH} />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((article) => {
                const lastCheck = article.backlinkChecks?.[0];
                const lastIdx   = article.indexationChecks?.[0];
                return (
                  <tr
                    key={article.id}
                    className="group relative transition-colors hover:bg-indigo-50/40"
                  >
                    {/* left accent on hover */}
                    <td className={cn(COL, "relative")}>
                      <div className="absolute inset-y-0 left-0 w-[2px] scale-y-0 bg-indigo-400 transition-transform group-hover:scale-y-100 rounded-r-full" />
                      <ArticleLink url={article.articleUrl} />
                    </td>
                    <td className={COL}>
                      {article.source
                        ? <span className="text-xs text-slate-600">{article.source}</span>
                        : <span className="text-slate-200 select-none">·</span>}
                    </td>
                    <td className={COL}>
                      <TypeBadge type={article.type} />
                    </td>
                    <td className={COL}>
                      {article.prix != null
                        ? <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                            {article.prix.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                          </span>
                        : <span className="text-slate-200 select-none">·</span>}
                    </td>
                    <td className={COL}>
                      {article.anchorText
                        ? <span className="inline-block max-w-[110px] truncate rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                            {article.anchorText}
                          </span>
                        : <span className="text-slate-200 select-none">·</span>}
                    </td>
                    <td className={COL}>
                      <ActiveBadge status={lastCheck?.status} />
                    </td>
                    <td className={COL}>
                      <DofollowBadge isDofollow={lastCheck?.isDofollow} />
                    </td>
                    <td className={COL}>
                      <IndexedBadge status={lastIdx?.status} />
                    </td>
                    <td className={COL}>
                      <Select
                        value={article.manualStatus}
                        onValueChange={(v) => v && handleStatusChange(article.id, v)}
                      >
                        <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
                          <StatusBadge status={article.manualStatus} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">En attente</SelectItem>
                          <SelectItem value="SENT">Envoyé</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                          <SelectItem value="DELETED">Supprimé</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    {isAdmin && (
                      <td className={cn(COL, "text-right")}>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition-all hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
