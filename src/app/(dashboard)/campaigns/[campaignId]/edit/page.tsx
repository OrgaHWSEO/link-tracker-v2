import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export default async function EditCampaignPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
  });

  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <CampaignForm
        isEditing
        defaultValues={{
          id: campaign.id,
          name: campaign.name,
          description: campaign.description || "",
          targetDomain: campaign.targetDomain,
          status: campaign.status,
          checkFrequency: campaign.checkFrequency,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        }}
      />
    </div>
  );
}
