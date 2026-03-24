"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { Trash2, ExternalLink, Link2Off, Globe } from "lucide-react";

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
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function ArticleLink({ url }: { url: string }) {
  try {
    const hostname = new URL(url).hostname;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline"
      >
        <span className="truncate max-w-[200px] text-xs">{url.replace(/^https?:\/\//, "")}</span>
        <ExternalLink className="h-3 w-3 shrink-0 text-indigo-400" />
      </a>
    );
  } catch {
    return <span className="text-gray-500 text-xs truncate max-w-[200px]">{url}</span>;
  }
}

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    ARTICLE:    { label: "Article",     bg: "bg-blue-50",   text: "text-blue-700" },
    FORUM:      { label: "Forum",       bg: "bg-purple-50", text: "text-purple-700" },
    COMMUNIQUE: { label: "Communiqué",  bg: "bg-orange-50", text: "text-orange-700" },
  };
  const c = config[type] || config.ARTICLE;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function ActiveBadge({ status }: { status?: string }) {
  if (!status) {
    return <span className="text-xs text-gray-300">—</span>;
  }
  const isActive = status === "FOUND";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
      isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
      {isActive ? "Actif" : "Inactif"}
    </span>
  );
}

function DofollowBadge({ isDofollow }: { isDofollow?: boolean | null }) {
  if (isDofollow === null || isDofollow === undefined) {
    return <span className="text-xs text-gray-300">—</span>;
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      isDofollow ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-600"
    }`}>
      {isDofollow ? "Dofollow" : "Nofollow"}
    </span>
  );
}

function IndexedBadge({ status }: { status?: string }) {
  if (!status || status === "UNKNOWN") {
    return <span className="text-xs text-gray-300">—</span>;
  }
  const isIndexed = status === "INDEXED";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      isIndexed ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-600"
    }`}>
      {isIndexed ? "Indexé" : "Non indexé"}
    </span>
  );
}

export function ArticleTable({ articles, campaignId, isAdmin }: ArticleTableProps) {
  const router = useRouter();

  async function handleStatusChange(articleId: string, newStatus: string) {
    const res = await fetch(`/api/campaigns/${campaignId}/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manualStatus: newStatus }),
    });
    if (res.ok) {
      toast.success("Statut mis à jour");
      router.refresh();
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleDelete(articleId: string) {
    if (!confirm("Supprimer ce backlink ?")) return;
    const res = await fetch(`/api/campaigns/${campaignId}/articles/${articleId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Backlink supprimé");
      router.refresh();
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Link2Off className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">Aucun backlink</p>
        <p className="mt-1 text-sm text-gray-500">Ajoutez des backlinks ou importez un fichier CSV.</p>
      </div>
    );
  }

  // Group by domain
  const grouped = articles.reduce<Record<string, Article[]>>((acc, article) => {
    const domain = getHostname(article.articleUrl);
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(article);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([domain, domainArticles]) => (
        <div key={domain} className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {/* Domain header */}
          <div className="flex items-center gap-2 border-b bg-gray-50 px-4 py-2.5">
            <Globe className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-600">{domain}</span>
            <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
              {domainArticles.length}
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-white">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">URL</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Source</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Prix</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Ancre</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Actif</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Lien</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Index</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                {isAdmin && (
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {domainArticles.map((article) => {
                const lastCheck = article.backlinkChecks?.[0];
                const lastIndexation = article.indexationChecks?.[0];
                return (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <ArticleLink url={article.articleUrl} />
                    </td>
                    <td className="px-4 py-3">
                      {article.source ? (
                        <span className="text-xs text-gray-600">{article.source}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={article.type} />
                    </td>
                    <td className="px-4 py-3">
                      {article.prix != null ? (
                        <span className="text-xs font-medium text-gray-700">
                          {article.prix.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {article.anchorText ? (
                        <span className="inline-block max-w-[120px] truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {article.anchorText}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge status={lastCheck?.status} />
                    </td>
                    <td className="px-4 py-3">
                      <DofollowBadge isDofollow={lastCheck?.isDofollow} />
                    </td>
                    <td className="px-4 py-3">
                      <IndexedBadge status={lastIndexation?.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={article.manualStatus}
                        onValueChange={(v) => v && handleStatusChange(article.id, v)}
                      >
                        <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0">
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
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(article.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
