import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CampaignTable } from "@/components/campaigns/campaign-table";
import { Plus } from "lucide-react";

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const where =
    isAdmin
      ? {}
      : {
          OR: [
            { createdById: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        };

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      _count: { select: { articles: true, members: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campagnes</h1>
          <p className="text-gray-500">Gerez vos campagnes de backlinks</p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle campagne
          </Button>
        </Link>
      </div>

      <CampaignTable
        campaigns={JSON.parse(JSON.stringify(campaigns))}
        isAdmin={isAdmin}
      />
    </div>
  );
}
