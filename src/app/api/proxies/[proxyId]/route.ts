import { NextRequest, NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { proxyId: string } }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();

  const proxy = await prisma.proxy.update({
    where: { id: params.proxyId },
    data: {
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      ...(typeof body.label === "string" ? { label: body.label || null } : {}),
    },
  });

  return NextResponse.json(proxy);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { proxyId: string } }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  await prisma.proxy.delete({ where: { id: params.proxyId } });

  return NextResponse.json({ success: true });
}
