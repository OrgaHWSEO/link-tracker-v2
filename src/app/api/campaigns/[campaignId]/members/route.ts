import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const members = await prisma.campaignMember.findMany({
    where: { campaignId: params.campaignId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  return NextResponse.json(members);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const adminError = requireAdmin(session.user.role);
  if (adminError) return adminError;

  const { userId } = await req.json();

  const member = await prisma.campaignMember.create({
    data: {
      campaignId: params.campaignId,
      userId,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const adminError = requireAdmin(session.user.role);
  if (adminError) return adminError;

  const { userId } = await req.json();

  await prisma.campaignMember.delete({
    where: {
      campaignId_userId: {
        campaignId: params.campaignId,
        userId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
