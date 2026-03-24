"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, Globe } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  ACTIVE:    { label: "Active",    dot: "bg-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700" },
  PAUSED:    { label: "En pause",  dot: "bg-amber-400",   bg: "bg-amber-50",   text: "text-amber-700" },
  COMPLETED: { label: "Terminée", dot: "bg-gray-400",    bg: "bg-gray-100",   text: "text-gray-600" },
};

interface Campaign {
  id: string;
  name: string;
  targetDomain: string;
  status: string;
  createdAt: string;
  createdBy: { name: string };
  _count: { articles: number; members: number };
}

interface CampaignTableProps {
  campaigns: Campaign[];
  isAdmin: boolean;
}

export function CampaignTable({ campaigns, isAdmin }: CampaignTableProps) {
  const router = useRouter();

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer la campagne "${name}" ? Cette action est irréversible.`)) return;
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Campagne supprimée");
      router.refresh();
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Globe className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">Aucune campagne</p>
        <p className="mt-1 text-sm text-gray-500">Créez votre première campagne pour commencer.</p>
        <Link href="/campaigns/new">
          <Button className="mt-4 h-9 bg-indigo-600 hover:bg-indigo-700 text-sm">
            Créer une campagne
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Campagne</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Articles</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Membres</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Créé par</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {campaigns.map((campaign) => {
            const s = statusConfig[campaign.status] || statusConfig.ACTIVE;
            return (
              <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {campaign.targetDomain}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-700">
                    {campaign._count.articles}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-xs font-semibold text-gray-700">
                    {campaign._count.members}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{campaign.createdBy.name}</td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">
                  {format(new Date(campaign.createdAt), "dd/MM/yyyy")}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-end gap-1">
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/campaigns/${campaign.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(campaign.id, campaign.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
