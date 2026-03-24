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
import { Trash2, ExternalLink, Link2Off } from "lucide-react";

interface Article {
  id: string;
  articleUrl: string;
  targetUrl: string;
  anchorText: string | null;
  manualStatus: string;
  backlinkChecks?: { status: string }[];
}

interface ArticleTableProps {
  articles: Article[];
  campaignId: string;
  isAdmin: boolean;
}

function HostnameLink({ url, className }: { url: string; className?: string }) {
  try {
    const hostname = new URL(url).hostname;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline ${className ?? ""}`}
      >
        <span className="truncate max-w-[180px]">{hostname}</span>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    );
  } catch {
    return <span className="text-gray-500 truncate max-w-[180px]">{url}</span>;
  }
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
    if (!confirm("Supprimer cet article ?")) return;
    const res = await fetch(`/api/campaigns/${campaignId}/articles/${articleId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Article supprimé");
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
        <p className="text-sm font-medium text-gray-900">Aucun article</p>
        <p className="mt-1 text-sm text-gray-500">Ajoutez des articles ou importez un fichier CSV.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Article</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">URL cible</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ancre</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Backlink</th>
            {isAdmin && (
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {articles.map((article) => {
            const lastCheck = article.backlinkChecks?.[0];
            return (
              <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5">
                  <HostnameLink url={article.articleUrl} />
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">
                  <HostnameLink url={article.targetUrl} className="text-gray-400 hover:text-gray-600 text-xs" />
                </td>
                <td className="px-4 py-3.5">
                  {article.anchorText ? (
                    <span className="inline-block max-w-[140px] truncate rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {article.anchorText}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <Select
                    value={article.manualStatus}
                    onValueChange={(v) => v && handleStatusChange(article.id, v)}
                  >
                    <SelectTrigger className="h-8 w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0">
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
                <td className="px-4 py-3.5">
                  {lastCheck ? (
                    <StatusBadge status={lastCheck.status} />
                  ) : (
                    <span className="text-xs text-gray-300">Non vérifié</span>
                  )}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
