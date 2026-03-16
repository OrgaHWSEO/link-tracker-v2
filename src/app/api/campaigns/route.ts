import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { campaignCreateSchema } from "@/lib/validations/campaign";

export async function GET(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  // Role-based filtering: members only see their campaigns
  if (session.user.role !== "ADMIN") {
    where.OR = [
      { createdById: session.user.id },
      { members: { some: { userId: session.user.id } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      _count: { select: { articles: true, members: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();
  const parsed = campaignCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { memberIds, ...data } = parsed.data;

  const campaign = await prisma.campaign.create({
    data: {
      ...data,
      createdById: session.user.id,
      members: {
        create: [
          { userId: session.user.id },
          ...(memberIds || [])
            .filter((id) => id !== session.user.id)
            .map((userId) => ({ userId })),
        ],
      },
    },
    include: {
      _count: { select: { articles: true, members: true } },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
