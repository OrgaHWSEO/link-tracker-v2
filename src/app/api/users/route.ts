import { NextResponse } from "next/server";
import { getSessionOrUnauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
