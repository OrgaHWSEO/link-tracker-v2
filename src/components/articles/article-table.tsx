"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { Trash2, ExternalLink } from "lucide-react";

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

export function ArticleTable({
  articles,
  campaignId,
  isAdmin,
}: ArticleTableProps) {
  const router = useRouter();

  async function handleStatusChange(articleId: string, newStatus: string) {
    const res = await fetch(
      `/api/campaigns/${campaignId}/articles/${articleId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualStatus: newStatus }),
      }
    );

    if (res.ok) {
      toast.success("Statut mis a jour");
      router.refresh();
    } else {
      toast.error("Erreur lors de la mise a jour");
    }
  }

  async function handleDelete(articleId: string) {
    if (!confirm("Supprimer cet article ?")) return;

    const res = await fetch(
      `/api/campaigns/${campaignId}/articles/${articleId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      toast.success("Article supprime");
      router.refresh();
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-gray-500">Aucun article dans cette campagne</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL de l&apos;article</TableHead>
            <TableHead>URL cible</TableHead>
            <TableHead>Ancre</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Backlink</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => {
            const lastCheck = article.backlinkChecks?.[0];
            return (
              <TableRow key={article.id}>
                <TableCell className="max-w-[200px]">
                  <a
                    href={article.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 truncate text-blue-600 hover:underline"
                  >
                    {(() => { try { return new URL(article.articleUrl).hostname; } catch { return article.articleUrl; } })()}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-gray-500">
                  {article.targetUrl}
                </TableCell>
                <TableCell className="text-gray-500">
                  {article.anchorText || "—"}
                </TableCell>
                <TableCell>
                  <Select
                    value={article.manualStatus}
                    onValueChange={(v) => v && handleStatusChange(article.id, v)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <StatusBadge status={article.manualStatus} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="SENT">Envoye</SelectItem>
                      <SelectItem value="CONFIRMED">Confirme</SelectItem>
                      <SelectItem value="DELETED">Supprime</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {lastCheck ? (
                    <StatusBadge status={lastCheck.status} />
                  ) : (
                    <span className="text-xs text-gray-400">Non verifie</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
