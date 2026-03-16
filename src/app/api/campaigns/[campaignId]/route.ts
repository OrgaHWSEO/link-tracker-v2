import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { campaignUpdateSchema } from "@/lib/validations/campaign";

export async function GET(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { articles: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Campagne introuvable" },
      { status: 404 }
    );
  }

  return NextResponse.json(campaign);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();
  const parsed = campaignUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { memberIds, ...data } = parsed.data;

  const campaign = await prisma.campaign.update({
    where: { id: params.campaignId },
    data,
  });

  // Update members if provided
  if (memberIds !== undefined) {
    await prisma.campaignMember.deleteMany({
      where: { campaignId: params.campaignId },
    });
    await prisma.campaignMember.createMany({
      data: memberIds.map((userId) => ({
        campaignId: params.campaignId,
        userId,
      })),
    });
  }

  return NextResponse.json(campaign);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const adminError = requireAdmin(session.user.role);
  if (adminError) return adminError;

  await prisma.campaign.delete({
    where: { id: params.campaignId },
  });

  return NextResponse.json({ success: true });
}
