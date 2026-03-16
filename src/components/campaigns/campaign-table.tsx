"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  PAUSED: { label: "En pause", variant: "secondary" },
  COMPLETED: { label: "Terminee", variant: "outline" },
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
    if (!confirm(`Supprimer la campagne "${name}" ? Cette action est irreversible.`)) {
      return;
    }

    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Campagne supprimee");
      router.refresh();
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-gray-500">Aucune campagne pour le moment</p>
        <Link href="/campaigns/new">
          <Button className="mt-4">Creer une campagne</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Domaine</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-center">Articles</TableHead>
            <TableHead className="text-center">Membres</TableHead>
            <TableHead>Cree par</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const status = statusMap[campaign.status] || statusMap.ACTIVE;
            return (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell className="text-gray-500">
                  {campaign.targetDomain}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {campaign._count.articles}
                </TableCell>
                <TableCell className="text-center">
                  {campaign._count.members}
                </TableCell>
                <TableCell className="text-gray-500">
                  {campaign.createdBy.name}
                </TableCell>
                <TableCell className="text-gray-500">
                  {format(new Date(campaign.createdAt), "dd/MM/yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/campaigns/${campaign.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDelete(campaign.id, campaign.name)
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
